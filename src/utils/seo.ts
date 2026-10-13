interface MetaOptions {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'place';
}

const DEFAULT_TITLE = 'KARIRI – Descoberta Local no Cariri Cearense';
const DEFAULT_DESC =
  'Guia digital e plataforma de descoberta local para Crato, Juazeiro do Norte, Barbalha e todo o Cariri cearense.';
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&h=630&q=85';

function setOrCreateMeta(property: string, content: string, isName = false) {
  const attr = isName ? 'name' : 'property';
  let tag = document.querySelector(`meta[${attr}="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Normaliza imagem para proporção social preferencial de 1200 × 630 px.
 */
function normalizeSocialImage(url?: string): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.includes('unsplash.com')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?auto=format&fit=crop&w=1200&h=630&q=85`;
  }
  return url;
}

export function setPageMeta(options: MetaOptions) {
  const fullTitle = options.title ? `${options.title} | KARIRI` : DEFAULT_TITLE;
  document.title = fullTitle;

  const desc = options.description || DEFAULT_DESC;
  const canonicalUrl =
    options.canonical ||
    (typeof window !== 'undefined' ? window.location.href : 'https://kariri.app.br/');
  const socialImage = normalizeSocialImage(options.image);

  // Standard Meta
  setOrCreateMeta('description', desc, true);

  // Open Graph (Facebook, WhatsApp, LinkedIn, Telegram)
  setOrCreateMeta('og:type', options.type || 'website');
  setOrCreateMeta('og:site_name', 'KARIRI');
  setOrCreateMeta('og:title', fullTitle);
  setOrCreateMeta('og:description', desc);
  setOrCreateMeta('og:url', canonicalUrl);
  setOrCreateMeta('og:image', socialImage);
  setOrCreateMeta('og:image:width', '1200');
  setOrCreateMeta('og:image:height', '630');
  setOrCreateMeta('og:image:alt', fullTitle);

  // Twitter / X Card
  setOrCreateMeta('twitter:card', 'summary_large_image', true);
  setOrCreateMeta('twitter:title', fullTitle, true);
  setOrCreateMeta('twitter:description', desc, true);
  setOrCreateMeta('twitter:image', socialImage, true);

  // Canonical URL
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);
}
