// Plugin rehype das notas de versão do VMais.
// Transforma o HTML gerado do Markdown na estrutura da página de referência:
// seções, itens com rótulo, etiquetas de status, cards, notas, destinos e tabelas com rolagem.
// Não tem dependências: percorre a árvore hast com funções próprias.

const STATUS = {
  '✅': { classe: 'ok', texto: 'Testado' },
  '⚠': { classe: 'warn', texto: 'Implementado, sem teste' },
  '⏳': { classe: 'pend', texto: 'Pendente' },
};
const RE_STATUS = /✅\uFE0F?|⚠\uFE0F?|⏳\uFE0F?/gu;
const RE_NUMERO = /^(\d+(?:\.\d+)*)\.?\s+/;
const RE_PARENTESES_FINAL = /\s*\(([^()]*)\)\s*$/;
const RE_DESTINO = /^(Retirada|Entrega|Pendência):$/u;
const CLASSE_DESTINO = { 'Retirada': 'r', 'Entrega': 'e', 'Pendência': 'p' };
const FRASEADO = new Set(['a', 'b', 'strong', 'i', 'em', 'code', 'span', 'br', 'small', 'del', 'sup', 'sub', 'img']);

const el = (tagName, classes, children = []) => ({
  type: 'element',
  tagName,
  properties: classes ? { className: Array.isArray(classes) ? classes : [classes] } : {},
  children,
});
const texto = (value) => ({ type: 'text', value });
const vazio = (n) => n.type === 'text' && !n.value.trim();
const textoPlano = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(textoPlano).join(''));
const temClasse = (n, c) => n.type === 'element' && [n.properties?.className ?? []].flat().includes(c);

function pill(simbolo) {
  const s = STATUS[simbolo.replace(/\uFE0F/g, '')];
  return el('span', ['pill', s.classe], [texto(s.texto)]);
}

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'secao';
}

// Troca os símbolos de status de um texto por etiquetas.
function dividirStatus(valor) {
  const saida = [];
  let ultimo = 0;
  for (const m of valor.matchAll(RE_STATUS)) {
    if (m.index > ultimo) saida.push(texto(valor.slice(ultimo, m.index)));
    saida.push(pill(m[0]));
    ultimo = m.index + m[0].length;
  }
  if (ultimo === 0) return [texto(valor)];
  if (ultimo < valor.length) saida.push(texto(valor.slice(ultimo)));
  return saida;
}

// Agrupa texto/elementos de fraseado soltos em parágrafos.
function agruparEmParagrafos(filhos) {
  const saida = [];
  let corrente = null;
  for (const n of filhos) {
    const fraseado = n.type === 'text' || (n.type === 'element' && FRASEADO.has(n.tagName));
    if (fraseado) {
      if (!corrente) {
        if (vazio(n)) continue;
        corrente = el('p', null, []);
        saida.push(corrente);
      }
      corrente.children.push(n);
    } else {
      corrente = null;
      if (!vazio(n)) saida.push(n);
    }
  }
  return saida;
}

// ---- Cabeçalhos ----

function separarNumero(filhos) {
  const copia = [...filhos];
  const i = copia.findIndex((n) => n.type === 'text' && n.value.trim());
  let numero = null;
  if (i >= 0) {
    const m = RE_NUMERO.exec(copia[i].value.trimStart());
    if (m) {
      numero = m[1];
      copia[i] = texto(copia[i].value.trimStart().slice(m[0].length));
    }
  }
  return { numero, filhos: copia };
}

function montarH2(h2, usados) {
  const { numero, filhos } = separarNumero(h2.children);
  let titulo = filhos;
  let pequeno = null;
  const ultimo = titulo.length - 1;
  if (ultimo >= 0 && titulo[ultimo].type === 'text') {
    const m = RE_PARENTESES_FINAL.exec(titulo[ultimo].value);
    if (m) {
      pequeno = `(${m[1]})`;
      titulo = [...titulo.slice(0, ultimo), texto(titulo[ultimo].value.slice(0, m.index))];
    }
  }
  const tituloPlano = textoPlano({ children: titulo }).trim();
  let slug = slugify(tituloPlano);
  for (let k = 2; usados.has(slug); k++) slug = `${slugify(tituloPlano)}-${k}`;
  usados.add(slug);
  const h2Novo = el('h2', null, [...titulo, ...(pequeno ? [texto(' '), el('small', null, [texto(pequeno)])] : [])]);
  const cabecalho = el('div', 'sec-head', [...(numero ? [el('span', 'n', [texto(numero)])] : []), h2Novo]);
  return { slug, numero, tituloPlano, cabecalho };
}

function aparar(nos) {
  const copia = nos.filter((n) => !vazio(n) || n !== nos[nos.length - 1]);
  const k = copia.length - 1;
  if (k >= 0 && copia[k].type === 'text') copia[k] = texto(copia[k].value.trimEnd());
  return copia;
}

function montarItem(h3, corpo) {
  const { numero, filhos } = separarNumero(h3.children);
  const antes = [];
  const depois = [];
  const etiquetas = [];
  let achou = false;
  for (const n of filhos) {
    if (achou) {
      depois.push(n);
      continue;
    }
    const m = n.type === 'text' ? /✅\uFE0F?|⚠\uFE0F?|⏳\uFE0F?/u.exec(n.value) : null;
    if (!m) {
      antes.push(n);
      continue;
    }
    achou = true;
    if (m.index > 0) antes.push(texto(n.value.slice(0, m.index)));
    etiquetas.push(pill(m[0]));
    const resto = n.value.slice(m.index + m[0].length);
    if (resto) depois.push(texto(resto));
  }
  // Texto entre parênteses depois do emoji vira uma segunda etiqueta.
  const extra = textoPlano({ children: depois }).trim().replace(/^\((.*)\)$/, '$1').replace(/^com\s+/i, '');
  if (extra) etiquetas.push(el('span', ['pill', 'ok'], [texto(extra)]));
  const rotulo = el('div', 'label', [
    ...(numero ? [el('span', 'id', [texto(numero)])] : []),
    el('h3', null, aparar(antes)),
    ...etiquetas,
  ]);
  return el('article', 'item', [rotulo, el('div', 'body', corpo)]);
}

// ---- Seções ----

function montarSecao(h2, conteudo, usados) {
  const info = montarH2(h2, usados);
  const temItens = conteudo.some((n) => n.type === 'element' && n.tagName === 'h3');
  const filhos = [info.cabecalho];

  if (temItens) {
    let atual = null;
    for (const n of conteudo) {
      if (n.type === 'element' && n.tagName === 'h3') {
        atual = { h3: n, corpo: [] };
        filhos.push(atual);
      } else if (atual) atual.corpo.push(n);
      else filhos.push(n);
    }
    for (let i = 0; i < filhos.length; i++) {
      if (filhos[i].h3) filhos[i] = montarItem(filhos[i].h3, filhos[i].corpo);
    }
  } else {
    const temLista = conteudo.some((n) => n.type === 'element' && n.tagName === 'ul');
    for (const n of conteudo) {
      if (n.type === 'element' && n.tagName === 'ul') {
        const cards = n.children
          .filter((c) => c.type === 'element' && c.tagName === 'li')
          .map((li) => el('div', 'fix', agruparEmParagrafos(li.children)));
        filhos.push(el('div', 'fix-list', cards));
      } else if (!temLista && n.type === 'element' && n.tagName === 'p') {
        filhos.push(el('div', 'info', n.children));
      } else filhos.push(n);
    }
  }
  const secao = el('section', 'block', filhos);
  secao.properties.id = info.slug;
  return { secao, dados: { id: info.slug, numero: info.numero, titulo: info.tituloPlano } };
}

// ---- Transformações gerais (status, notas, tabelas, destinos) ----

function ehDestino(li) {
  const primeiro = li.children.find((n) => !vazio(n));
  if (primeiro?.type === 'element' && primeiro.tagName === 'strong') {
    const m = RE_DESTINO.exec(textoPlano(primeiro).trim().normalize('NFC'));
    if (m) return { nome: m[1], strong: primeiro };
  }
  return null;
}

function etiquetaDestino(nome) {
  return el('span', ['tag', CLASSE_DESTINO[nome]], [texto(nome)]);
}

function converterDestinos(ul) {
  const lis = ul.children.filter((c) => c.type === 'element' && c.tagName === 'li');
  const marcas = lis.map(ehDestino);
  const resto = (li, strong) => {
    const filhos = li.children.filter((n) => n !== strong);
    const i = filhos.findIndex((n) => !vazio(n));
    if (i >= 0 && filhos[i].type === 'text') filhos[i] = texto(filhos[i].value.trimStart());
    return filhos;
  };
  if (lis.length && marcas.every(Boolean)) {
    return el('div', 'dest', lis.map((li, k) => el('div', null, [etiquetaDestino(marcas[k].nome), el('p', null, resto(li, marcas[k].strong))])));
  }
  lis.forEach((li, k) => {
    if (!marcas[k]) return;
    li.children = li.children.map((n) => (n === marcas[k].strong ? etiquetaDestino(marcas[k].nome) : n));
  });
  return ul;
}

function converterNota(bq) {
  const filhos = bq.children.filter((n) => !vazio(n));
  const unico = filhos.length === 1 && filhos[0].type === 'element' && filhos[0].tagName === 'p';
  return el('div', 'note', unico ? filhos[0].children : filhos);
}

function percorrer(pai) {
  if (!pai.children) return;
  const saida = [];
  for (let filho of pai.children) {
    if (filho.type === 'text') {
      saida.push(...dividirStatus(filho.value));
      continue;
    }
    if (filho.type !== 'element' || filho.tagName === 'code' || filho.tagName === 'pre') {
      saida.push(filho);
      continue;
    }
    if (filho.tagName === 'blockquote') filho = converterNota(filho);
    else if (filho.tagName === 'ul') filho = converterDestinos(filho);
    percorrer(filho);
    if (filho.tagName === 'td' || filho.tagName === 'th') separarEtiquetaDoTexto(filho);
    saida.push(filho.tagName === 'table' ? el('div', 'scroll', [filho]) : filho);
  }
  pai.children = saida;
}

// Em células de tabela, a etiqueta fica numa linha e o texto da explicação abaixo.
function separarEtiquetaDoTexto(celula) {
  const filhos = celula.children;
  const saida = [];
  for (let i = 0; i < filhos.length; i++) {
    saida.push(filhos[i]);
    if (temClasse(filhos[i], 'pill') && i + 1 < filhos.length && !vazio(filhos[i + 1])) {
      saida.push({ type: 'element', tagName: 'br', properties: {}, children: [] });
      if (filhos[i + 1].type === 'text') filhos[i + 1] = texto(filhos[i + 1].value.trimStart());
    }
  }
  celula.children = saida;
}

export default function rehypeRelease() {
  return (tree, file) => {
    const nos = tree.children.filter((n) => !vazio(n) && !(n.type === 'element' && n.tagName === 'hr'));
    const usados = new Set();
    const secoes = [];
    const saida = [];
    let i = 0;
    while (i < nos.length) {
      const n = nos[i];
      if (n.type === 'element' && n.tagName === 'h2') {
        const conteudo = [];
        i++;
        while (i < nos.length && !(nos[i].type === 'element' && nos[i].tagName === 'h2')) conteudo.push(nos[i++]);
        const { secao, dados } = montarSecao(n, conteudo, usados);
        secoes.push(dados);
        saida.push(secao);
      } else {
        saida.push(n);
        i++;
      }
    }
    tree.children = saida;
    percorrer(tree);

    // O layout lê esta lista (remarkPluginFrontmatter) para montar o índice fixo.
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.secoes = secoes;
  };
}
