// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeRelease from './src/plugins/rehype-release.mjs';

export default defineConfig({
  output: 'static',
  site: 'https://vmais-release.vercel.app', // ajustar se o domínio mudar
  base: '/', // ajustar na publicação
  markdown: {
    // Os plugins rehype exigem o processador "unified" (o padrão do Astro 7 é o Sätteri).
    processor: unified({ rehypePlugins: [rehypeRelease] }),
  },
});
