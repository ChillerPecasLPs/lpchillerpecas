/**
 * Validação rigorosa de telefone brasileiro.
 *
 * Bloqueios implementados:
 * - Dígitos repetidos (00000000000, 11111111111, ...)
 * - DDDs inválidos (lista oficial Anatel — exclui 14 DDDs nunca atribuídos)
 * - Comprimento incorreto (aceita 10 dígitos para fixo / 11 para celular)
 * - Celular sem o "9" no terceiro dígito (formato Anatel pós-2014)
 *
 * Não valida operadora, autenticidade do número ou se está ativo
 * (isso é responsabilidade do canal de discagem, não do form).
 */

// DDDs ativos no Brasil (Anatel) — fonte: Plano Geral de Códigos Nacionais
const VALID_DDDS = new Set([
  // SP
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  // RJ/ES
  21, 22, 24, 27, 28,
  // MG
  31, 32, 33, 34, 35, 37, 38,
  // PR/SC/RS
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55,
  // Centro-Oeste/Norte
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  // BA/SE
  71, 73, 74, 75, 77, 79,
  // NE
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  // Norte
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export type ValidationReason =
  | 'tamanho'
  | 'repetido'
  | 'ddd_invalido'
  | 'formato_celular';

export interface ValidationResult {
  ok: boolean;
  reason?: ValidationReason;
  message?: string;
}

const MESSAGES: Record<ValidationReason, string> = {
  tamanho: 'Informe DDD + número (10 ou 11 dígitos).',
  repetido: 'Esse número não parece válido. Verifique e tente novamente.',
  ddd_invalido: 'Esse DDD não existe. Confira o código de área.',
  formato_celular: 'Celular com 11 dígitos deve começar com 9 após o DDD.',
};

/**
 * Valida um telefone BR (com ou sem máscara).
 * Retorna { ok: true } ou { ok: false, reason, message }.
 */
export function validatePhoneBR(input: string): ValidationResult {
  const digits = (input ?? '').replace(/\D/g, '');

  // Comprimento
  if (digits.length < 10 || digits.length > 11) {
    return { ok: false, reason: 'tamanho', message: MESSAGES.tamanho };
  }

  // Dígitos repetidos
  if (/^(\d)\1+$/.test(digits)) {
    return { ok: false, reason: 'repetido', message: MESSAGES.repetido };
  }

  // DDD válido
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (!VALID_DDDS.has(ddd)) {
    return { ok: false, reason: 'ddd_invalido', message: MESSAGES.ddd_invalido };
  }

  // Celular: 11 dígitos → o 3º dígito deve ser 9 (regra Anatel pós-2014)
  if (digits.length === 11 && digits[2] !== '9') {
    return { ok: false, reason: 'formato_celular', message: MESSAGES.formato_celular };
  }

  return { ok: true };
}

/**
 * Retorna apenas os dígitos do telefone (sem máscara).
 */
export function digitsOnly(input: string): string {
  return (input ?? '').replace(/\D/g, '');
}

/**
 * Aplica máscara BR no número (preview enquanto digita).
 *   (XX) XXXXX-XXXX  → 11 dígitos (celular)
 *   (XX) XXXX-XXXX   → 10 dígitos (fixo)
 */
export function applyMaskBR(input: string): string {
  const d = digitsOnly(input).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length < 3) return `(${d}`;
  if (d.length < 8) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length < 11) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Mascara o telefone para tracking (sem expor PII em GA/dataLayer).
 * Ex: '5511940518767' → '+5511****8767'
 */
export function maskForTracking(digits: string): string {
  if (digits.length < 6) return '***';
  return `+55${digits.slice(0, 2)}****${digits.slice(-4)}`;
}
