interface MetaOptions {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
}

const DEFAULT_TITLE = 'KARIRI – Descoberta Local no Cariri Cearense';
const DEFAULT_DESC =
  'Guia digital e plataforma de descoberta local para Crato, Juazeiro do Norte e Barbalha no Cariri cearense.';

export function setPageMeta(options: MetaOptions) {
  const fullTitle = options.title ? `${options.title} | KARIRI` : DEFAULT_TITLE;
  document.title = fullTitle;

  const desc = options.description || DEFAULT_DESC;

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', desc);
  }

  // Update OpenGraph
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', fullTitle);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', desc);

  if (options.image) {
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', options.image);
  }

  // Update Canonical URL
  const canonicalUrl = options.canonical || (typeof window !== 'undefined' ? window.location.href : 'https://kariri.app.br/');
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);
}
