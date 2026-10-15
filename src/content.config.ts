import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const releases = defineCollection({
  // O slug da página é a versão (string), não o nome do arquivo.
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/releases',
    generateId: ({ entry, data }) => String(data.versao ?? entry.replace(/\.md$/, '')),
  }),
  schema: z.object({
    versao: z.string({ error: 'Frontmatter: "versao" é obrigatória e deve ser texto entre aspas, ex.: "5.2026.10.11".' }),
    banco: z.number({ error: 'Frontmatter: "banco" é obrigatório e deve ser um número (versão do banco de dados).' }),
    data: z.coerce.date({ error: 'Frontmatter: "data" é obrigatória, no formato AAAA-MM-DD.' }),
    tema: z.string({ error: 'Frontmatter: "tema" é obrigatório (texto do subtítulo da capa).' }).min(1, 'Frontmatter: "tema" não pode ficar vazio.'),
  }),
});

export const collections = { releases };
