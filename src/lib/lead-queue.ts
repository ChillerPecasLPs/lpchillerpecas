/**
 * Fila offline de leads — protege a campanha de Ads contra falhas do webhook.
 *
 * Cenário: usuário envia o form, webhook (Hablla) retorna erro ou está fora do ar.
 * Em vez de perder o lead, o payload é enfileirado em localStorage e reenviado
 * automaticamente ao restaurar conexão (ou no próximo carregamento da página).
 *
 * Garantias:
 * - Itens expiram após MAX_AGE_HOURS (não enviar leads "velhos demais")
 * - Limite de tentativas por item (MAX_ATTEMPTS) evita loop infinito
 * - O usuário SEMPRE é redirecionado pro wa.me como fallback hard,
 *   mesmo que o webhook esteja 100% morto.
 */

const KEY = 'cp_pending_leads';
const MAX_AGE_HOURS = 24;
const MAX_ATTEMPTS = 5;

export interface QueuedLead {
  payload: Record<string, unknown>;
  ts: number;        // epoch ms
  attempts: number;
}

function safeRead(): QueuedLead[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(items: QueuedLead[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* localStorage cheio ou indisponível — silencioso */
  }
}

/**
 * Enfileira um lead que falhou no envio síncrono.
 */
export function enqueue(payload: Record<string, unknown>): void {
  const queue = safeRead();
  queue.push({ payload, ts: Date.now(), attempts: 0 });
  safeWrite(queue);
}

/**
 * Lê a fila atual (não modifica).
 */
export function getQueue(): QueuedLead[] {
  return safeRead();
}

/**
 * Limpa a fila inteira.
 */
export function clearQueue(): void {
  try { localStorage.removeItem(KEY); } catch {}
}

/**
 * Tenta reenviar todos os itens válidos da fila para o webhook.
 * Retorna { sent, failed, expired }.
 *
 * Itens com sucesso são removidos.
 * Itens que falham têm `attempts++` e ficam pra próxima tentativa.
 * Itens com idade > MAX_AGE_HOURS ou attempts >= MAX_ATTEMPTS são descartados.
 */
export async function flushQueue(
  webhookUrl: string,
): Promise<{ sent: number; failed: number; expired: number }> {
  const queue = safeRead();
  if (queue.length === 0) return { sent: 0, failed: 0, expired: 0 };

  const cutoff = Date.now() - MAX_AGE_HOURS * 3600 * 1000;
  let sent = 0;
  let failed = 0;
  let expired = 0;
  const remaining: QueuedLead[] = [];

  for (const item of queue) {
    if (item.ts < cutoff || item.attempts >= MAX_ATTEMPTS) {
      expired++;
      continue;
    }
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item.payload, retry_from_queue: true, retry_attempt: item.attempts + 1 }),
        signal: ctrl.signal,
        keepalive: true,
      });
      clearTimeout(timeout);
      if (r.ok) {
        sent++;
      } else {
        remaining.push({ ...item, attempts: item.attempts + 1 });
        failed++;
      }
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
      failed++;
    }
  }

  safeWrite(remaining);
  return { sent, failed, expired };
}
