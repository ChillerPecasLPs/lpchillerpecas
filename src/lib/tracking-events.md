# Catálogo de eventos — Chiller Peças LP

Contrato entre o time de mídia/analytics e o código. Todo evento aqui listado é pusheado em `window.dataLayer` pelo site. Use esses nomes para criar triggers no Google Tag Manager.

## Convenção de `data-*` nos elementos

Todo CTA rastreável carrega no mínimo:

| Atributo | Obrigatório | Exemplo |
|---|---|---|
| `data-gtm-event` | sim | `cta_click` |
| `data-gtm-location` | sim | `hero_primary` |
| `data-gtm-label` | sim | `pedir_cotacao_whatsapp` |
| `data-gtm-category` | não | `whatsapp` |
| `data-gtm-value` | não | `1` |

Trigger GTM recomendado:
- **Trigger type**: Click — All Elements
- **Fire on**: `Click Element` matches CSS selector `[data-gtm-event]`
- **Built-in variable**: enable `Click Element`
- **Custom variable (DOM Element)**: get attribute `data-gtm-location`, `data-gtm-label`, `data-gtm-category` conforme necessário

## Eventos

### Navegação / visualização

| event | quando dispara | params principais | GA4 equivalente |
|---|---|---|---|
| `lp_page_view` | Após `DOMContentLoaded` | `page_title`, `page_location`, `attribution_*` (first/last touch, utm, click_ids) | `page_view` |
| `lp_section_view` | IntersectionObserver entra 50% da seção | `section_id` | — |
| `lp_scroll_depth` | Ao cruzar 25% / 50% / 75% / 100% | `depth` (25/50/75/100) | `scroll` |

### Interação com CTAs

| event | quando dispara | params principais | GA4 equivalente |
|---|---|---|---|
| `lp_cta_click` | Clique em qualquer elemento com `data-gtm-event="cta_click"` | `location`, `label`, `category`, `value` | `select_content` |

### Modal WhatsApp

| event | quando dispara | params principais | GA4 equivalente |
|---|---|---|---|
| `lp_modal_open` | Modal é aberto por algum CTA | `trigger_location` | — |
| `lp_modal_close` | Modal é fechado | `method` (`esc`, `backdrop`, `button`, `submit_success`) | — |
| `lp_form_submit_attempt` | Usuário clica "Solicitar orçamento" | `phone_valid` (bool), `trigger_location` | `form_start` |
| `lp_form_validation_fail` | Validação rejeita antes do POST | `reason` (`tamanho`/`repetido`/`ddd_invalido`/`formato_celular`/`honeypot`), `trigger_location` | — |
| `lp_form_submit_retry` | Tentativa N (1 ou 2) falhou, próxima vai disparar | `attempt`, `error_code` | — |
| `lp_form_submit_retry_success` | POST funcionou após retry (recuperação) | `attempt` | — |
| `lp_form_submit_success` | Webhook Hablla retornou 200 (1ª tentativa ou retry) | `phone_masked`, `trigger_location`, `attribution_*` | `generate_lead` (value 1, currency BRL) |
| `lp_form_submit_queued` | Webhook falhou após 3 tentativas → lead enfileirado em localStorage | `error_code`, `attempt`, `trigger_location` | — |
| `lp_lead_queue_flushed` | Fila offline foi reenviada ao voltar online ou no boot | `sent`, `failed`, `expired` | `generate_lead` (1× por `sent`) |
| `lp_whatsapp_redirect` | wa.me é aberto em nova aba (sempre, mesmo se webhook caiu) | `trigger_location`, `webhook_ok` (bool) | — |
| `lp_consent_decision` | Usuário decidiu sobre cookies (banner ou config) | `consent_source` (`banner`/`essential_only`/`accept_all`/`configure`/`restored`), `consent_analytics`/`marketing`/`personalization` (`granted`/`denied`) | — |
| `lp_error_page_view` | Página de erro 404 carregada | `error_code` (404), `page_path`, `page_location` | `exception` |

## Parâmetros de atribuição (em `lp_page_view` e conversões)

Todos os eventos de conversão (`lp_form_submit_success`) também carregam:

```
attribution_utm_source
attribution_utm_medium
attribution_utm_campaign
attribution_utm_term
attribution_utm_content
attribution_utm_id
attribution_gclid
attribution_gbraid
attribution_wbraid
attribution_fbclid
attribution_msclkid
attribution_ttclid
attribution_first_touch_source      (utm_source do primeiro toque)
attribution_first_touch_campaign    (utm_campaign do primeiro toque)
attribution_first_touch_timestamp
attribution_session_id
```

## Como mapear em GA4 (via GTM)

1. **Tag**: GA4 Configuration → Measurement ID `G-XXXXXXX`
2. **Tag**: GA4 Event — nome `generate_lead`
   - Trigger: `lp_form_submit_success`
   - Parâmetros: `value = 1`, `currency = BRL`, `phone_masked = {{DLV - phone_masked}}`
3. **Tag**: GA4 Event — nome `select_content`
   - Trigger: `lp_cta_click`
   - Parâmetros: `content_type = cta`, `item_id = {{DLV - label}}`

## Como mapear em Google Ads (via GTM)

1. **Tag**: Google Ads Conversion Tracking
   - Conversion ID + Label
   - Trigger: `lp_form_submit_success`
   - Dynamic value: `1` (ou defina valor médio do lead)
   - GCLID capturado automaticamente via Auto-tagging (confirmar no config da conta Ads)

## Debug

No Chrome DevTools Console, rode:

```js
window.dataLayer
```

Você verá todos os eventos enfileirados. Em GTM Preview/Debug mode, cada push aparece como "Message" na timeline.

Para simular uma conversão sem preencher o form:

```js
window.dataLayer.push({
  event: 'lp_form_submit_success',
  phone_masked: '+5511****8767',
  trigger_location: 'debug',
});
```
