# DOCUMENTAÇÃO TÉCNICA – KARIRI.APP

> **Versão:** 1.0.0  
> **Última Atualização:** Novembro de 2026  
> **Repositório Frontend:** [diegocvmoreira/kaririapp](https://github.com/diegocvmoreira/kaririapp)  
> **API Oficial de Produção:** `https://api.kariri.app.br/api`  
> **Domínio Principal:** [kariri.app.br](https://kariri.app.br)

---

## 1. Visão Geral e Propósito do Kariri.app

O **Kariri.app** é uma plataforma digital progressiva (PWA) de descoberta local, turismo, gastronomia, lazer, cultura e serviços voltada à região do **Cariri Cearense**, cobrindo inicialmente o triângulo Crajubar (**Crato**, **Juazeiro do Norte** e **Barbalha**), com suporte arquitetural para expansão a outros municípios do Ceará e do Brasil.

### Princípios Norteadores de Arquitetura
1. **Mobile-First & PWA:** Interface pensada primordialmente para uso em smartphones com suporte a instalação nativa na tela inicial, manifest padronizado e operação resiliente offline.
2. **Desacoplamento Completo Frontend / Backend:** O frontend é uma Single Page Application (SPA) autônoma em React + TypeScript + Vite, consumindo uma API REST em Laravel 11 / PHP 8.2+.
3. **Resiliência a Falhas de Rede:** Implementação de camadas de diagnóstico técnico no cliente, validação estrita de contratos JSON Schema, sanitização de logs e fallbacks graciosos para garantir que o aplicativo continue operável mesmo em variações de conectividade.
4. **Independência de Serviços Proprietários Pagos:** Uso de OpenStreetMap e Leaflet para renderização cartográfica de alta performance sem dependência de chaves de mapas pagas.

---

## 2. Stack Tecnológica

### Frontend
- **Linguagem:** TypeScript 5.7+ (com checagem estrita via `tsc --noEmit`).
- **Framework Base:** React 19 / Vite 6.
- **Roteamento:** React Router DOM v7 (modo SPA com rotas públicas, privadas e administrativas).
- **Estilização:** Tailwind CSS v4 com sistema de design tokens próprio (paleta inspirada no solo caririense e no Soldadinho-do-Araripe: `#DE1F2A`, tons terrosos e escuros).
- **Mapas & Geodados:** Leaflet 1.9 + React-Leaflet com marcadores customizados em SVG por categoria.
- **Ícones:** Lucide React.
- **PWA:** Service Worker (`public/sw.js`) com cache isolado de App Shell, manifest (`manifest.json`) e meta-tags para iOS e Android.

### Backend (API REST Externa)
- **Framework:** Laravel 11+ / PHP 8.2+ sob servidor LiteSpeed / Hostinger.
- **Banco de Dados:** MySQL com suporte a índices espaciais / coordenadas geográficas.
- **Autenticação:** Laravel Sanctum (Tokens Bearer com expiração e revogação).
- **Upload de Mídia:** Armazenamento local/S3 com conversão forçada de imagens para WebP e limite de 5 MB.

---

## 3. Arquitetura do Cliente HTTP e Gestão de Estado

### 3.1 Cliente Centralizado (`src/services/api/config.ts`)
Toda a comunicação de rede é intermediada pelo método `apiClient<T>(endpoint, options)`.

**Principais Responsabilidades:**
- **Resolução de URL:** Lê `import.meta.env.VITE_API_BASE_URL` ou assume por padrão o endpoint oficial `https://api.kariri.app.br/api`.
- **Prevenção de Preflight Desnecessário:** Cabeçalhos `Content-Type: application/json` são aplicados exclusivamente quando há corpo na requisição (`options.body`) e este não for instância de `FormData`.
- **Preservação de Boundary em Uploads:** Requisições com `FormData` não recebem `Content-Type` manual, permitindo que o navegador configure o cabeçalho `multipart/form-data; boundary=...` automaticamente.
- **Segurança de Autenticação:** Recupera o token do `localStorage` (`kariri_auth_token`), sanitiza strings inválidas (`'undefined'`, `'null'`) e injeta `Authorization: Bearer <token>`.
- **Intercepção Global de Erro 401:** Caso o servidor responda com status 401 (token expirado ou revogado), limpa as credenciais do `localStorage` e emite o evento global `window.dispatchEvent(new CustomEvent('auth:expired'))` para que a interface redirecione o usuário ao login.

### 3.2 Modos de Execução (Mock vs Real)
O arquivo `.env` controla o modo de dados através da variável:
```env
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://api.kariri.app.br/api
```
- **`VITE_USE_MOCK_DATA=false` (Produção/Staging):** Efetua requisições HTTP reais contra a API Laravel.
- **`VITE_USE_MOCK_DATA=true` (Desenvolvimento Offline/Testes Isolados):** Ativa a suíte em memória (`mockPlaces`, `mockEvents`, `mockCities`, `mockCategories`) com simulação de latência de rede realista via `simulateNetworkDelay()`.

---

## 4. Detalhamento das Funcionalidades da Aplicação

### 4.1 Descoberta e Página Inicial (`HomePage.tsx`)
A porta de entrada do aplicativo concentra uma experiência imersiva de exploração rápida:
- **Hero Contextual:** Exibe saudação dinâmica conforme o horário local ("Bom dia", "Boa tarde", "Boa noite") e identifica a cidade ativa no seletor regional.
- **Busca Direta:** Campo integrado com redirecionamento automático para a página de exploração filtrada.
- **Filtros Rápidos (Chips Interativos):**
  - *Aberto agora:* Filtra locais cujo horário atual coincide com os intervalos de funcionamento cadastrados.
  - *Gratuito:* Filtra locais de custo zero ou eventos com `is_free = true`.
  - *Acessível:* Filtra locais com itens de acessibilidade física preenchidos (rampas, banheiros adaptados, etc.).
  - *Com fotos:* Exibe apenas registros que possuem fotos de capa válidas.
- **Carrosséis Horizontais de Alta Fluidez:**
  - Carrossel de Categorias (`CategoryCard`).
  - Carrossel de Destaques da Região (`PlaceCard`).
  - Carrossel da Agenda Cultural (`EventCard`).
- **Seção "Perto de Você" com Geodistância Transparente:**
  - Se o GPS estiver ativado pelo usuário, calcula a distância real em linha reta até o ponto com base nas coordenadas do dispositivo.
  - Se o GPS estiver inativo, estima a distância a partir das coordenadas centrais da cidade selecionada.
  - Permite ativar e desativar o GPS com um clique.

### 4.2 Catálogo e Exploração Avançada (`ExplorePage.tsx`)
Mecanismo central de busca e filtragem do guia:
- **Abas de Conteúdo:** Alternância instantânea entre a listagem de **Locais** e a de **Eventos**.
- **Filtro Multi-Cidade:** Permite focar em um município específico (Crato, Juazeiro do Norte, Barbalha) ou explorar toda a região metropolitana do Cariri ("Todas as cidades").
- **Filtro por Categoria:** Seleção de nichos (Gastronomia, Ecoturismo, Cultura e Tradição, Hospedagem, Café e Bistrô, etc.).
- **Ordenação Flexível:** Destaques, Mais Próximos (se GPS habilitado), Melhores Avaliados e Mais Recentes.
- **Contador Dinâmico de Resultados:** Exibe feedback em tempo real sobre a quantidade de itens localizados.

### 4.3 Detalhes do Local (`PlaceDetailPage.tsx`)
Visão 360° do estabelecimento ou atrativo turístico:
- **Galeria Visual:** Imagem de capa em alta resolução e visualizador de fotos complementares.
- **Horário de Funcionamento em Tempo Real:** Selo de status ("Aberto Agora" ou "Fechado") calculado com base no fuso horário local e nos intervalos cadastrados.
- **Ações Rápidas de Contato:** Botões diretos para chamada telefônica, conversa no WhatsApp, perfil do Instagram e rota no mapa.
- **Comodidades e Acessibilidade:** Ícones padronizados para Wi-Fi, Estacionamento, Ar-Condicionado, Pet Friendly, Espaço Infantil e Acessibilidade para PcD.
- **Favoritos Integrados:** Botão de coração que persiste o estado no banco de dados via `POST /api/favorites` para usuários logados ou no armazenamento local em modo visitante.
- **Galeria Colaborativa:** Seção onde frequentadores podem enviar fotos reais do local através do modal de upload.
- **Avaliações da Comunidade:** Listagem de avaliações com notas de 1 a 5 estrelas e formulário para submissão de novos reviews.
- **Reivindicação de Propriedade (*Claim Business*):** Atalho para proprietários iniciarem o processo de posse e verificação do local.

### 4.4 Agenda Cultural e Eventos (`EventDetailPage.tsx`)
Focada em divulgar feiras, shows, exposições, festivais e tradições:
- **Datas e Horários:** Destaque para início, término e periodicidade.
- **Localização do Evento:** Informação clara se o evento ocorre em um local já cadastrado na plataforma ou em endereço livre.
- **Preço / Entrada:** Indicação visual de gratuidade ou faixa de valor de ingresso.
- **Compartilhamento Nativo:** Integração com a *Web Share API* do dispositivo (WhatsApp, Telegram, etc.) com fallback de cópia de link para a área de transferência.

### 4.5 Mapa Interativo Regional (`MapPage.tsx`)
Página dedicada à exploração espacial do Cariri:
- **Motor OpenStreetMap / Leaflet:** Carregamento de tiles abertos sem custos e com alta velocidade.
- **Marcadores Temáticos:** Cada categoria possui um ícone SVG exclusivo e cor representativa.
- **Clusterização e Popups Informativos:** Clicar em um marcador abre um mini-card com foto, nome, endereço e botão para ver detalhes ou traçar rota.
- **Tratamento Rigoroso de Coordenadas:** Registros que não possuem coordenadas geográficas confirmadas permanecem com `latitude: null, longitude: null` e são omitidos da renderização do mapa, sem travar o componente ou gerar marcadores fictícios no mar (coordenada 0,0).
- **Filtros Sobrepostos:** Barra de categorias suspensa para ligar/desligar pontos no mapa.

### 4.6 Cadastro e Contribuição Colaborativa (`CreatePlacePage.tsx` e `CreateEventPage.tsx`)
Permite que comerciantes, produtores culturais e a população cadastrem novos locais e eventos:
- **Upload Real de Imagens:** Seleção de arquivo local com envio imediato para `POST /api/uploads/images` via `FormData`. A URL WebP devolvida pelo servidor substitui qualquer string Base64 temporária.
- **Geocodificação Assistida:** O usuário pode digitar o endereço ou apontar no mini-mapa interativo para definir as coordenadas exatas.
- **Etapas de Validação:** Verificação de campos obrigatórios, formatação de telefone/WhatsApp e seleção de categorias canônicas.
- **Fluxo de Curadoria (Status):** O registro nasce com status `pending`. Não aparece publicamente até ser revisado e aprovado por um moderador.

### 4.7 Minhas Contribuições (`MyContributionsPage.tsx`)
Painel onde o usuário autenticado acompanha o andamento de tudo o que enviou à plataforma:
- Visualização de locais e eventos submetidos.
- Status claro: **Em Análise (Pendente)**, **Aprovado e Publicado** ou **Rejeitado**.
- Feedback dos curadores em caso de necessidade de ajustes nas informações.

### 4.8 Reivindicação de Estabelecimentos (*Business Claims*) (`businessClaims.ts`)
Mecanismo de segurança para conectar os donos reais aos seus perfis no app:
- Formulário onde o proprietário informa razão social/CNPJ, cargo, telefone comercial e documentos comprobatórios.
- Submissão via `POST /api/business-claims`.
- O status da reivindicação pode ser: `pending`, `reviewed`, `approved` ou `rejected`.
- Uma vez aprovado pela moderação, o usuário ganha o selo de perfil verificado e acesso de edição ao seu local.

### 4.9 Painel Administrativo (`AdminDashboardPage.tsx`)
Área de retaguarda acessível exclusivamente por usuários com papel (`role`) `admin`:
- **Moderação de Conteúdo:** Aprovação com 1 clique de locais e eventos pendentes (`PATCH /api/admin/places/{id}/publish`).
- **Gestão de Municípios:** Criação, edição, ativação e desativação de cidades e regiões atendidas pelo guia.
- **Gestão de Categorias:** Edição de nomes, slugs, cores e ícones do sistema.
- **Auditoria de Reivindicações:** Análise de documentos enviados pelos empresários para concessão do selo verificado.

### 4.10 Autenticação, Recuperação de Acesso e Perfil
- **Login e Registro (`LoginPage.tsx`, `RegisterPage.tsx`):** Autenticação por e-mail e senha com validação de formato e emissão de token Sanctum.
- **Recuperação de Senha (`ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`):** Envio de link com token temporário para redefinição segura de senha.
- **Verificação de E-mail (`VerifyEmailPage.tsx`):** Confirmação de propriedade de conta via link seguro.
- **Perfil do Usuário (`ProfilePage.tsx`):** Gestão de avatar, nome, e-mail, distinção canônica entre cidade de nascimento (`birth_city`) e município atual no Cariri (`current_city`).

### 4.11 Módulo de Diagnósticos Técnicos da API (`diagnostics.ts`)
Sistema inteligente embutido no frontend para interceptar falhas de comunicação e classificá-las automaticamente:
| Categoria | Causa Técnica Típica | Mensagem Apresentada | Ação Sugerida |
| :--- | :--- | :--- | :--- |
| **CORS** | Falha no preflight OPTIONS ou cabeçalho `Access-Control-Allow-Origin` ausente/inválido | Bloqueio de Origem Cruzada | Verificar `config/cors.php` no Laravel e regex de origens |
| **CLOUDFLARE** | Desafio de bot/captcha ou erro de proxy (520-525) | Interferência do Proxy Cloudflare | Ajustar regras do WAF ou criar bypass para rota `/api/*` |
| **ROTA (404)** | Endpoint ou registro (slug/id) inexistente no banco | Recurso Não Encontrado | Conferir rotas em `routes/api.php` ou slugs na tabela MySQL |
| **AUTENTICACAO** | Token ausente/expirado (401) ou e-mail não verificado (403) | Sessão Expirada ou Acesso Não Permitido | Efetuar novo login ou confirmar e-mail |
| **FORMATO_JSON** | Servidor retornou HTML (erro 500 do PHP/Apache) ou 422 | Resposta Não-JSON / Validação | Consultar `storage/logs/laravel.log` na Hostinger |
| **REDE** | Dispositivo do usuário sem internet (`navigator.onLine = false`) | Sem Conexão com a Internet | Verificar conexão Wi-Fi ou dados móveis |

---

## 5. Fluxo e Especificação do Upload de Imagens

O Kariri.app aboliu o armazenamento de imagens em Base64 no banco de dados, adotando um fluxo moderno de upload via API com entrega de URLs públicas otimizadas:

```
[ Usuário seleciona imagem ]
              │
              ▼
[ Validação no Frontend: JPG, PNG, WebP (máx. 5MB) ]
              │
              ▼
[ Envio via FormData: POST /api/uploads/images ] (com token Bearer)
              │
              ▼
[ Backend Laravel: Validação + Conversão para WebP + Armazenamento ]
              │
              ▼
[ Resposta JSON: { url: "https://api.kariri.app.br/storage/...", path: "..." } ]
              │
              ▼
[ Frontend associa a URL a cover_image ou ao array images ]
```

### Contrato de Upload (`src/services/api/uploads.ts`)
```typescript
export interface UploadImageResponse {
  url: string;
  path: string;
  mime: string;
  size: number;
}

export async function uploadImage(file: File): Promise<UploadImageResponse>
```

---

## 6. Mapeamento de Rotas e Contratos da API REST

Todas as chamadas partem do prefixo `https://api.kariri.app.br/api`:

### 6.1 Catálogo Público
- `GET /cities`: Lista de municípios atendidos no Cariri e cidades de referência.
- `GET /categories`: Lista de categorias de locais com ícones e slugs.
- `GET /places`: Catálogo de locais publicados com suporte a paginação e parâmetros:
  - `city_slug`: Filtro por slug de município.
  - `category`: Filtro por slug de categoria.
  - `sort_by`: `featured` (destaques), `nearby` (proximidade), `rating`, `recent`.
  - `latitude` e `longitude`: Ponto de referência para ordenação por distância.
  - `query`: Busca textual geral.
- `GET /places/{slug}`: Obtenção detalhada de um local específico.
- `GET /events`: Agenda de eventos públicos com filtro por cidade e data.
- `GET /events/{slug}`: Detalhes de um evento específico.

### 6.2 Autenticação e Usuários
- `POST /auth/register`: Cadastro de nova conta.
- `POST /auth/login`: Autenticação e emissão de token Sanctum.
- `POST /auth/logout`: Revogação do token ativo.
- `GET /auth/me`: Dados do perfil do usuário autenticado.
- `PUT /auth/profile`: Atualização de dados cadastrais.
- `POST /auth/forgot-password`: Solicitação de redefinição de senha por e-mail.
- `POST /auth/reset-password`: Aplicação da nova senha com token.

### 6.3 Interações do Usuário
- `GET /favorites`: Lista de locais favoritados pelo usuário autenticado.
- `POST /favorites`: Adicionar ou remover local da lista de favoritos (toggle).
- `POST /reviews`: Envio de comentário e nota para um local.
- `POST /business-claims`: Submissão de reivindicação de propriedade de estabelecimento.
- `POST /places`: Submissão de novo local pela comunidade (`status: pending`).
- `POST /events`: Submissão de novo evento pela comunidade (`status: pending`).
- `POST /uploads/images`: Upload de imagem com devolução de URL WebP pública.

### 6.4 Painel Administrativo
- `GET /admin/places/pending`: Fila de locais aguardando curadoria.
- `PATCH /admin/places/{id}/publish`: Aprovação e publicação de local.
- `PATCH /admin/places/{id}/reject`: Rejeição de local com justificativa.
- `GET /admin/claims`: Fila de reivindicações de empresas pendentes de auditoria.
- `POST /admin/cities`: Cadastro de nova cidade na base regional.

---

## 7. Variáveis de Ambiente e Configuração (`.env`)

| Variável | Tipo | Padrão Recomendado | Descrição |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | String | `https://api.kariri.app.br/api` | Endpoint base oficial da API REST Laravel. |
| `VITE_USE_MOCK_DATA` | Booleano | `false` | Se `true`, força o uso de dados mockados locais. Em produção deve ser `false`. |
| `VITE_TURNSTILE_SITE_KEY` | String | *(opcional)* | Chave pública do Cloudflare Turnstile para proteção contra bots. |
| `PORT` | Número | `3000` | Porta local utilizada pelo servidor de desenvolvimento do Vite. |

---

## 8. Guia de Instalação, Testes e Publicação

### 8.1 Requisitos Mínimos
- Node.js 20.x ou superior.
- NPM 10.x ou superior.

### 8.2 Instalação das Dependências
```bash
npm install
```

### 8.3 Execução em Modo de Desenvolvimento
```bash
npm run dev
```
O aplicativo estará disponível em `http://localhost:3000`.

### 8.4 Verificação de Qualidade e Tipagem
```bash
# Validação estrita de TypeScript sem emissão de código
npm run lint
```

### 8.5 Execução da Suíte de Testes Automatizados
A plataforma inclui testes de contrato arquitetural, integridade geográfica e validação de base:
```bash
# Executa todos os testes (contratos + locais)
npm test

# Testes individuais:
npm run test:contract  # Validação de JSON Schemas, sanitização e artefatos
npm run test:places    # Validação dos 33 locais homologados, status e coordenadas
```

### 8.6 Compilação para Produção (Build)
```bash
npm run build
```
Os arquivos otimizados e minificados serão gerados no diretório `/dist`, prontos para publicação em qualquer servidor web ou CDN compatível com Single Page Applications (Hostinger, Cloudflare Pages, Vercel, Netlify, Nginx ou Apache).
