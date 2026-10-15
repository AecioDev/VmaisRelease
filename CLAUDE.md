# VMais Releases — instruções permanentes

Projeto Astro estático com as notas de versão do VMais. Responda sempre em português do Brasil.

## Fluxo "nova release"

Quando o usuário pedir para criar uma release a partir de um `.md` (caminho em `novas/` ou texto colado):

1. Leia o `.md` inteiro. **Nunca** resuma, reescreva, traduza ou omita conteúdo. Se algo parecer errado ou duplicado, avise no final em vez de corrigir.
2. Crie `src/content/releases/<versao>.md`. Extraia do cabeçalho do arquivo bruto (título "Release X", "Versão do sistema", "Versão do banco de dados", "Tema da versão", "Documento gerado em") os campos `versao`, `banco`, `data` e `tema` do frontmatter, e remova essas linhas do corpo. O restante do texto permanece igual.
3. Ajuste só a forma, seguindo as convenções do README: títulos `## N.`, `### N.M`, subtítulos em `####`, notas "Pendente:/Atenção:" em citação `>`. Mantenha ✅ ⚠️ ⏳ como estão.
4. Rode `npm run build`. Se falhar, corrija o arquivo da release (não o layout) e rode de novo.
5. Termine com um resumo curto: versão criada, quantidade de seções e itens, o que foi ajustado na forma e qualquer dúvida de conteúdo.

## Regras

- Não altere `ReleaseLayout.astro`, `release.css` nem o plugin ao criar uma release. Mudanças de design só se o usuário pedir.
- Não faça commit, push ou deploy sem pedido.
- Datas no site: dd/mm/aaaa. Versão sempre como string.
- A pasta `referencia/` é só consulta.
