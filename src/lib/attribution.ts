/**
 * Attribution capture — first-touch + last-touch + session
 *
 * Reads UTM params and ad click IDs from the URL on every page load,
 * persists first-touch in localStorage (never overwritten) and last-touch
 * (rewritten on every attributed visit). Also mints a session id kept in
 * sessionStorage for joining events.
 *
 * LGPD: no PII is persisted here — only campaign parameters which are
 * public by nature. The phone number only leaves the browser on explicit
 * form submit.
 */

export const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
] as const;

export const CLICK_IDS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'ttclid',
] as const;

const FIRST_TOUCH_KEY = 'cp_first_touch';
const LAST_TOUCH_KEY = 'cp_last_touch';
const SESSION_KEY = 'cp_session';

export type AttributionSnapshot = {
  utm: Record<string, string>;
  click_ids: Record<string, string>;
  attribution: {
    first_touch: Record<string, unknown> | null;
    last_touch: Record<string, unknown> | null;
  };
  source_url: string;
  page_path: string;
  referrer: string;
  user_agent: string;
  viewport: { w: number; h: number };
  session_id: string;
  timestamp: string;
};

function extract(params: URLSearchParams, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = params.get(k) ?? '';
  return out;
}

/**
 * Called once per page load from BaseLayout. Safe to call multiple times.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const params = url.searchParams;

  const utm = extract(params, UTM_PARAMS);
  const click_ids = extract(params, CLICK_IDS);
  const hasAttribution =
    Object.values(utm).some(Boolean) || Object.values(click_ids).some(Boolean);

  const now = new Date().toISOString();
  const touch = {
    ...utm,
    ...click_ids,
    timestamp: now,
    landing_url: url.href,
    referrer: document.referrer || '',
  };

  if (hasAttribution) {
    if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
    }
    localStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(touch));
  }

  if (!sessionStorage.getItem(SESSION_KEY)) {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
}

/**
 * Build a snapshot for the webhook payload / dataLayer push.
 * Prefers current URL params; falls back to last-touch values; then empty string.
 */
export function getAttributionPayload(): AttributionSnapshot {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const first = safeParse(localStorage.getItem(FIRST_TOUCH_KEY));
  const last = safeParse(localStorage.getItem(LAST_TOUCH_KEY));

  const utm: Record<string, string> = {};
  for (const k of UTM_PARAMS) utm[k] = params.get(k) ?? (last?.[k] as string) ?? '';

  const click_ids: Record<string, string> = {};
  for (const k of CLICK_IDS) click_ids[k] = params.get(k) ?? (last?.[k] as string) ?? '';

  return {
    utm,
    click_ids,
    attribution: { first_touch: first, last_touch: last },
    source_url: url.href,
    page_path: url.pathname,
    referrer: document.referrer || '',
    user_agent: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    session_id: sessionStorage.getItem(SESSION_KEY) ?? '',
    timestamp: new Date().toISOString(),
  };
}

function safeParse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
