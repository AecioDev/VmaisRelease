// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeRelease from './src/plugins/rehype-release.mjs';

export default defineConfig({
  output: 'static',
  site: 'https://exemplo.com.br', // ajustar na publicação
  base: '/', // ajustar na publicação
  markdown: {
    // Os plugins rehype exigem o processador "unified" (o padrão do Astro 7 é o Sätteri).
    processor: unified({ rehypePlugins: [rehypeRelease] }),
  },
});
