# KARIRI.APP

## Documento Mestre do Produto e Especificação Técnica
### Versão 1.0

---

# 1. IDENTIDADE DO PRODUTO
**Nome:** Kariri.app  
**Categoria:** Plataforma digital de descoberta local  
**Região inicial:** Cariri, Ceará  
**Municípios iniciais:** Crato, Juazeiro do Norte, Barbalha  
**Domínio:** kariri.app.br  
**Plataforma:** Web responsiva + PWA  
**Conceito:** O Kariri.app é uma plataforma digital para descobrir lugares, experiências, cultura, gastronomia, serviços, turismo e eventos no Cariri cearense.  
A ideia central é: **Descobrir o Cariri em um só lugar.**

---

# 2. PRINCÍPIOS DO PRODUTO
- 2.1 Mobile first
- 2.2 Descoberta
- 2.3 Proximidade
- 2.4 Conteúdo local
- 2.5 Simplicidade
- 2.6 Escalabilidade
- 2.7 Separação entre frontend e backend
- 2.8 Independência do WordPress

---

# 3. REFERÊNCIA VISUAL
Inspiração de UX/UI com identidade caririense própria (cores, cultura da Chapada e Soldadinho-do-Araripe).

---

# 4. IDENTIDADE VISUAL
Arquivos centralizados em `src/assets/brand/`:
- `logo.svg`
- `logo-dark.svg`
- `logo-light.svg`
- `favicon.svg`
- `icons/`

---

# 5. DESIGN SYSTEM
Tokens centralizados para cores, tipografia, bordas, sombras e breakpoints.

---

# 6. RESPONSIVIDADE
Suporte de 360px a 1440px+. Navegação inferior no mobile e superior/adaptativa no desktop.

---

# 7. ARQUITETURA GERAL
Frontend React + Vite + Tailwind + Leaflet + PWA.
Backend Laravel + PHP + MySQL REST API (desacoplado via `src/services/api/`).
