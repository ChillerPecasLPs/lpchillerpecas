/**
 * Lightweight dataLayer helper.
 *
 * Pushes a GTM-ready event. Works whether GTM is loaded or not — if not loaded,
 * events still queue on `window.dataLayer` and will be replayed when the
 * container initializes.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export type TrackParams = Record<string, unknown>;

export function trackEvent(name: string, params: TrackParams = {}): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: name,
    timestamp: new Date().toISOString(),
    page_path: window.location.pathname,
    page_location: window.location.href,
    ...params,
  });
}

/**
 * Reads every data-gtm-* attribute off a trigger element into a flat object.
 * Used when a CTA is clicked so the event params carry the element's context.
 */
export function readGtmAttrs(el: HTMLElement | null): TrackParams {
  if (!el) return {};
  const out: TrackParams = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-gtm-')) {
      const key = attr.name.slice('data-gtm-'.length).replace(/-/g, '_');
      out[key] = attr.value;
    }
  }
  return out;
}

/**
 * Masks the phone number for event params (keeps country+area, hides rest).
 * "+5511940518767" → "+5511****8767"
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 6) return '***';
  const head = clean.slice(0, 4);
  const tail = clean.slice(-4);
  return `+${head}****${tail}`;
}
