# Documentação do Plano de Eventos de Analytics (GA4 / GTM) - Kariri.app

Em conformidade rigorosa com a **LGPD (Lei Geral de Proteção de Dados)** e o padrão **Google Consent Mode v2**.

---

## 1. Princípios de Proteção de Dados e Anti-PII

O Kariri.app aplica o princípio do *Privacy by Design* e *Privacy by Default*.
**É terminantemente proibido o envio dos seguintes dados para o GA4 / GTM:**
- E-mail de usuários ou empresas
- Telefones e números de WhatsApp
- Senhas ou hashes
- Tokens de autenticação (Bearer tokens, tokens de redefinição)
- Nomes completos de usuários
- Conteúdo textual de comentários e avaliações (reviews)
- Endereços residenciais particulares
- Documentos de comprovação ou notas de reivindicação de empresas (claims)

O módulo `analyticsService.ts` contém um sanitizador automático (`sanitizeAnalyticsPayload`) que intercepta e descarta qualquer parâmetro que corresponda a essas chaves ou contenha padrões de e-mail e telefone antes do envio à camada `window.gtag` ou `window.dataLayer`.

---

## 2. Dicionário de Eventos do Kariri.app

| Evento | Finalidade | Gatilho / Trigger | Parâmetros Coletados | Consentimento | Destino | Retenção |
|---|---|---|---|---|---|---|
| `page_view` | Medir audiência e navegação da SPA | Troca de rota no React Router | `page_path`, `page_title`, `page_location` | `analytics` | GA4 / GTM | 14 meses |
| `search` | Compreender demandas de busca dos visitantes | Submissão de busca na barra ou página Explorar | `search_term` (higienizado), `results_count`, `category_slug`, `city_slug` | `analytics` | GA4 / GTM | 14 meses |
| `city_selected` | Medir interesse regional e cidades ativas | Seleção no modal, header ou filtros | `city_id`, `city_slug`, `city_name`, `selection_context`, `is_cariri_region` | `analytics` | GA4 / GTM | 14 meses |
| `category_selected` | Analisar segmentos com mais engajamento | Clique em categoria ou subcategoria | `category_id`, `category_slug`, `category_name` | `analytics` | GA4 / GTM | 14 meses |
| `place_view` | Mensurar visibilidade de estabelecimentos | Abertura da página de detalhes do local | `place_id`, `place_slug`, `place_name`, `category_slug`, `city_slug`, `is_verified` | `analytics` | GA4 / GTM | 14 meses |
| `event_view` | Avaliar alcance da agenda cultural | Abertura do detalhe de evento cultural | `event_id`, `event_slug`, `event_title`, `city_slug`, `is_free` | `analytics` | GA4 / GTM | 14 meses |
| `map_open` | Avaliar exploração geográfica interativa | Acesso à tela de mapa ou clique em "Ver no mapa" | `source_context`, `initial_city_slug` | `analytics` | GA4 / GTM | 14 meses |
| `directions_click` | Conversão física (intenção de deslocamento) | Clique no botão "Como Chegar" / Google Maps | `target_id`, `target_type`, `target_slug`, `city_slug` | `analytics` | GA4 / GTM | 14 meses |
| `whatsapp_click` | Conversão direta de contato comercial | Clique no botão WhatsApp do local | `place_id`, `place_slug`, `city_slug`, `category_slug` | `analytics` | GA4 / GTM | 14 meses |
| `phone_click` | Conversão de ligação telefônica | Clique no botão Ligar | `place_id`, `place_slug`, `city_slug` | `analytics` | GA4 / GTM | 14 meses |
| `website_click` | Conversão de tráfego para site do local | Clique no link externo do local | `place_id`, `place_slug`, `city_slug` | `analytics` | GA4 / GTM | 14 meses |
| `favorite_add` | Medir intenção de retorno e apreço | Usuário adiciona aos favoritos | `item_id`, `item_type`, `item_slug`, `city_slug` | `analytics` | GA4 / GTM | 14 meses |
| `favorite_remove` | Ajuste de preferências | Usuário remove item dos favoritos | `item_id`, `item_type`, `item_slug`, `city_slug` | `analytics` | GA4 / GTM | 14 meses |
| `sign_up_start` | Início do funil de cadastro | Entrada na página `/cadastro` | `source_page` | `analytics` | GA4 / GTM | 14 meses |
| `sign_up` | Conclusão do cadastro de conta | Conta criada com sucesso | `method`, `has_birth_city`, `has_current_city`, `cariri_preferred_city`, `marketing_consent` | `analytics` | GA4 / GTM | 14 meses |
| `login` | Autenticação no sistema | Login realizado com sucesso | `method`, `user_role` | `analytics` | GA4 / GTM | 14 meses |
| `password_reset_request` | Acompanhar demanda de suporte/esquecimento | Solicitação de link de redefinição | `status` | `analytics` | GA4 / GTM | 14 meses |
| `review_start` | Início do fluxo de avaliação da comunidade | Abertura do formulário de review | `place_id`, `place_slug` | `analytics` | GA4 / GTM | 14 meses |
| `review_submit` | Envio de avaliação para moderação | Submissão do formulário | `place_id`, `place_slug`, `rating` (1-5), `has_title` | `analytics` | GA4 / GTM | 14 meses |
| `review_published` | Avaliação aprovada e publicada | Aprovação no painel de moderação | `place_id`, `place_slug`, `rating` | `analytics` | GA4 / GTM | 14 meses |
| `claim_start` | Início de reivindicação de titularidade | Dono inicia processo de claim | `place_id`, `place_slug` | `analytics` | GA4 / GTM | 14 meses |
| `claim_submit` | Submissão de dados de titularidade | Envio da solicitação de claim | `place_id`, `place_slug`, `claim_role_type` | `analytics` | GA4 / GTM | 14 meses |
| `claim_approved` | Empresa verificada com sucesso | Aprovação administrativa do claim | `place_id`, `place_slug` | `analytics` | GA4 / GTM | 14 meses |
| `share_place` | Viralidade e compartilhamento de local | Compartilhado via WhatsApp, Link ou WebShare | `place_id`, `place_slug`, `share_channel` | `analytics` | GA4 / GTM | 14 meses |
| `share_event` | Viralidade e compartilhamento de evento | Compartilhado via WhatsApp, Link ou WebShare | `event_id`, `event_slug`, `share_channel` | `analytics` | GA4 / GTM | 14 meses |
| `install_pwa` | Adoção do Progressive Web App | Aceite ou recusa do banner de instalação | `outcome` ('accepted' / 'dismissed'), `platform` | `analytics` | GA4 / GTM | 14 meses |
| `api_error` | Monitoramento agregado de estabilidade | Falha HTTP capturada no cliente | `http_status`, `endpoint_path`, `diagnostic_category` | `analytics` | GA4 / GTM | 14 meses |

---

## 3. Relatórios Estratégicos Configurados

1. **Relatório de Aquisição & Origem:** Tráfego orgânico, direto, referências externas e adoção de PWA.
2. **Relatório de Busca:** Termos mais buscados, buscas sem resultado e cidades mais procuradas.
3. **Visualização de Locais & Eventos:** Estabelecimentos e festivais com maior audiência e tempo de tela.
4. **Contatos Gerados (Leads para Negócios):** Volume de cliques em WhatsApp, Ligações e Traçar Rota por estabelecimento.
5. **Funil de Cadastro & Retenção:** `sign_up_start` → `sign_up` → `login` recorrente.
6. **Conversão por Cidade:** Engajamento segregado por Crato, Juazeiro do Norte, Barbalha e outras cidades do Cariri.
7. **Conversão por Categoria:** Gastronomia, Turismo, Hospedagem, Cultura e Comércio local.
8. **Erros de API & Qualidade Técnica:** Agregação por status HTTP (404, 422, 500, falhas de conexão) para ação preventiva da equipe de TI.
9. **Uso de Favoritos:** Volume de adições e remoções de estabelecimentos favoritos na plataforma.
10. **Comunidade (Reviews e Claims):** Volume de avaliações enviadas e reivindicações de estabelecimentos concluídas.
