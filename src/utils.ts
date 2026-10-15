import type { CollectionEntry } from 'astro:content';

export type Secao = { id: string; numero: string | null; titulo: string };

/** Monta um caminho respeitando o `base` do astro.config.mjs. */
export function url(caminho = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${caminho}`;
}

/** dd/mm/aaaa (a data do frontmatter é lida em UTC). */
export function formatarData(data: Date): string {
  const d = String(data.getUTCDate()).padStart(2, '0');
  const m = String(data.getUTCMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${data.getUTCFullYear()}`;
}

/** Texto do tema: escapa o HTML e converte **negrito** em <b>. */
export function temaHtml(tema: string): string {
  return tema
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

const partes = (v: string) => v.split('.').map((n) => Number(n) || 0);

/** Mais recente primeiro: por data e, em empate, pela versão. */
export function ordenarReleases(lista: CollectionEntry<'releases'>[]) {
  return [...lista].sort((a, b) => {
    const porData = b.data.data.getTime() - a.data.data.getTime();
    if (porData) return porData;
    const pa = partes(a.data.versao);
    const pb = partes(b.data.versao);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const dif = (pb[i] ?? 0) - (pa[i] ?? 0);
      if (dif) return dif;
    }
    return 0;
  });
}
