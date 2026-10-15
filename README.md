# VMais Releases

Site estático (Astro) com as notas de versão do sistema VMais. Cada release é um arquivo Markdown em `src/content/releases/`; o site gera uma página por release e um índice.

## Comandos

```bash
npm install        # instala as dependências (uma vez)
npm run dev        # servidor de desenvolvimento em http://localhost:4321
npm run build      # gera o site estático em dist/
npm run preview    # serve o resultado de dist/ para conferência
```

## Estrutura de pastas

```
CLAUDE.md                      instruções permanentes para o Claude Code
astro.config.mjs               site/base (ajustar na publicação) e plugin rehype
referencia/                    página e release de referência (só consulta)
novas/                         entrada: .md brutos de novas releases
src/
  content.config.ts            collection "releases" (glob loader + zod)
  content/releases/            um .md por release, ex.: 5.2026.10.11.md
  layouts/ReleaseLayout.astro  capa + índice fixo + corpo + rodapé
  pages/index.astro            índice de releases
  pages/releases/[...slug].astro  uma página por release
  plugins/rehype-release.mjs   transforma o HTML do Markdown (seções, itens, status...)
  styles/release.css           CSS do design aprovado
  utils.ts                     datas, links com base e ordenação
```

## Como adicionar uma release

1. Coloque o `.md` bruto em `novas/` e peça ao Claude Code para criar a release (veja o fluxo em `CLAUDE.md`), ou crie `src/content/releases/<versao>.md` à mão.
2. Rode `npm run build`. O build falha com mensagem clara se faltar algum campo do frontmatter.

### Frontmatter (obrigatório)

```yaml
---
versao: "5.2026.10.11"   # texto entre aspas; também é o endereço da página
banco: 32                # número: versão do banco de dados
data: 2026-10-14         # AAAA-MM-DD (aparece como dd/mm/aaaa)
tema: "Fluxo de venda com **Doca** ..."   # subtítulo da capa; aceita **negrito**
---
```

### Convenções do corpo

| Markdown | Resultado |
|---|---|
| `## 2. Novidades` | Seção numerada (o número vem do título; sem número, a seção fica sem número). Entra no índice fixo. |
| `### 2.1 Título ✅` | Item da seção, com rótulo à esquerda e etiqueta de status. |
| `### 2.3 Título ✅ (texto)` | Além do status, o texto entre parênteses vira uma segunda etiqueta (`com ` inicial é removido). |
| `#### Subtítulo` | Subtítulo pequeno em caixa alta dentro do item. |
| `> **Pendente:** ...` | Caixa de destaque âmbar (também para "Atenção:" etc.). |
| Tabelas GFM e `código` | Tabelas ganham rolagem horizontal no celular. |
| `- **Retirada:** ...` | Em listas em que todos os itens começam assim (Retirada, Entrega, Pendência), vira o grupo de cartões coloridos; senão, só a etiqueta colorida. |
| Lista em seção sem `###` | Cada item de primeiro nível vira um card. |
| Parágrafo em seção sem `###` nem lista | Caixa de informação azul. |

### Símbolos de status

| Símbolo | Etiqueta |
|---|---|
| ✅ | Testado |
| ⚠️ | Implementado, sem teste |
| ⏳ | Pendente |

Os símbolos ficam no `.md`; o plugin os troca por etiquetas com texto.
