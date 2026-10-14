/**
 * Utilitário de manipulação e normalização de strings
 * Remove acentos, diacríticos e normaliza caixa para comparações e buscas insensíveis a caracteres especiais.
 * Exemplo: "café" -> "cafe", "São Paulo" -> "sao paulo", "Crato" -> "crato"
 */
export function normalizeText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Compara se a string 'source' contém a string 'query' após normalização completa de acentos e caixa.
 */
export function fuzzyIncludes(source: string | null | undefined, query: string | null | undefined): boolean {
  if (!query) return true;
  if (!source) return false;
  return normalizeText(source).includes(normalizeText(query));
}
