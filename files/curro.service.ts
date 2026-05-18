/**
 * curro.service.ts — Orquestador principal de El Curro v2
 *
 * Este servicio es el único punto de entrada que el endpoint /api/curro
 * necesita llamar. Coordina internamente:
 *
 *   1. duende.service      — personalidad adaptativa
 *   2. venueState.service  — estado del local en tiempo real
 *   3. customerMemory.service — memoria persistente del cliente
 *   4. Claude API (Anthropic) — generación de respuesta
 *   5. Persistencia de la interacción para aprendizaje futuro
 *
 * El endpoint sólo necesita:
 *   const reply = await curroChat({ sessionId, userMessage });
 *
 * Características:
 *  - Streaming opcional (devuelve AsyncGenerator).
 *  - Límite de tokens configurable por Brevity.
 *  - System-prompt construido de forma declarativa.
 *  - Manejo de errores con fallback gracioso en sevillano.
 */

import Anthropic                       from '@anthropic-ai/sdk';
import {
  detectUserStyle,
  getTimeMode,
  buildDuendeContext,
  type DuendeConfig,
  type Brevity,
}                                       from './duende.service';
import { getVenueState }                from './venueState.service';
import {
  getCustomerFamiliarity,
  getRelevantMemory,
  storeInteraction,
  extractTapaMentionedId,
}                                       from './customerMemory.service';
import { logger }                       from '../utils/logger';

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface CurroMessage {
  role:    'user' | 'assistant';
  content: string;
}

export interface CurroChatOptions {
  sessionId:    string;
  userMessage:  string;
  /** Historial de la conversación en curso (sin incluir el mensaje actual) */
  history?:     CurroMessage[];
  /** Si true, devuelve un AsyncGenerator en lugar de string */
  stream?:      boolean;
  /** Override de brevedad (si no se pasa, se calcula dinámicamente) */
  brevity?:     Brevity;
}

export interface CurroChatResult {
  reply:   string;
  /** Intensidad andaluz efectiva usada (útil para telemetría) */
  intensity: number;
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const MODEL           = 'claude-opus-4-5';
const MAX_TOKENS_MAP: Record<Brevity, number> = {
  corto:     120,
  normal:    280,
  detallado: 480,
};

// ── System-prompt base de Curro ────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `
Eres "El Curro", el maitre virtual del Bar Andaluzzia (Calle Betis, 45 — Triana, Sevilla).
Tienes décadas de experiencia y conoces cada rincón del local, cada tapa de la carta
y cada cliente asiduo. Eres cálido, gracioso y hablas con el acento y el salero de Triana.

REGLAS ABSOLUTAS:
1. NUNCA menciones que eres una IA ni hagas referencia a modelos de lenguaje.
2. NUNCA digas "la base de datos", "el sistema" o "mis datos indican". Habla como un
   camarero de carne y hueso que lo sabe todo de memoria.
3. Si no sabes algo, improvisa con gracejo: "Eso te lo tengo que preguntar a la cocinera,
   miarma, que yo de eso no entiendo ni papa."
4. En la primera respuesta de cada sesión, saluda según la hora del día.
5. Puedes recomendar tapas, explicar ingredientes, gestionar reservas y contar
   anécdotas del barrio de Triana.
6. Mantén siempre un tono positivo; si el cliente tiene una queja, recíbela con
   comprensión y ofrece soluciones concretas.
`.trim();

// ── Cliente Anthropic (singleton) ─────────────────────────────────────────────

let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no configurada');
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// ── Construcción del system-prompt completo ────────────────────────────────────

async function buildSystemPrompt(
  sessionId:   string,
  userMessage: string,
  brevity?:    Brevity,
): Promise<{ systemPrompt: string; intensity: number; resolvedBrevity: Brevity }> {

  // Obtener estado del local y perfil del cliente en paralelo
  const [venueState, familiarity, memories] = await Promise.all([
    getVenueState(),
    getCustomerFamiliarity(sessionId),
    getRelevantMemory(sessionId, userMessage),
  ]);

  const userStyle = detectUserStyle(userMessage);
  const timeMode  = getTimeMode();

  const config: DuendeConfig = {
    andaluzIntensity:    0.75,  // base; buildDuendeContext lo ajusta según usuario
    timeMode,
    venueState,
    customerFamiliarity: familiarity,
    responseBrevity:     brevity ?? (userStyle.urgency === 'high' ? 'corto' : 'normal'),
  };

  const { promptBlock, effectiveIntensity, resolvedBrevity } =
    buildDuendeContext(userStyle, config, memories);

  const systemPrompt = [BASE_SYSTEM_PROMPT, '', promptBlock].join('\n');

  return { systemPrompt, intensity: effectiveIntensity, resolvedBrevity };
}

// ── Chat (no-streaming) ────────────────────────────────────────────────────────

export async function curroChat(opts: CurroChatOptions): Promise<CurroChatResult> {
  const { sessionId, userMessage, history = [], brevity } = opts;

  const { systemPrompt, intensity, resolvedBrevity } =
    await buildSystemPrompt(sessionId, userMessage, brevity);

  const messages: Anthropic.MessageParam[] = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage },
  ];

  let reply: string;

  try {
    const response = await getClient().messages.create({
      model:      MODEL,
      max_tokens: MAX_TOKENS_MAP[resolvedBrevity],
      system:     systemPrompt,
      messages,
    });

    reply = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('');

  } catch (err) {
    logger.error('Curro API call failed', { error: err, sessionId });
    // Fallback gracioso en sevillano
    reply = '¡Uy, miarma! Se me ha ido el santo al cielo un momentito. Vuelve a preguntarme, anda.';
  }

  // Persistir interacción de forma asíncrona (no bloquea la respuesta)
  setImmediate(async () => {
    try {
      const tapaMentionedId = await extractTapaMentionedId(reply);
      await storeInteraction(sessionId, userMessage, reply, tapaMentionedId);
    } catch (err) {
      logger.warn('Post-chat persistence failed (non-critical)', { error: err });
    }
  });

  return { reply, intensity };
}

// ── Chat (streaming) ──────────────────────────────────────────────────────────

export async function* curroChatStream(
  opts: Omit<CurroChatOptions, 'stream'>,
): AsyncGenerator<string> {
  const { sessionId, userMessage, history = [], brevity } = opts;

  const { systemPrompt, resolvedBrevity } =
    await buildSystemPrompt(sessionId, userMessage, brevity);

  const messages: Anthropic.MessageParam[] = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage },
  ];

  let fullReply = '';

  try {
    const stream = getClient().messages.stream({
      model:      MODEL,
      max_tokens: MAX_TOKENS_MAP[resolvedBrevity],
      system:     systemPrompt,
      messages,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        const text = chunk.delta.text;
        fullReply += text;
        yield text;
      }
    }
  } catch (err) {
    logger.error('Curro streaming failed', { error: err, sessionId });
    const fallback = '¡Uy! Se me ha cruzao el cable, miarma. Vuelve a intentarlo.';
    fullReply = fallback;
    yield fallback;
  }

  // Persistir de forma asíncrona
  setImmediate(async () => {
    try {
      const tapaMentionedId = await extractTapaMentionedId(fullReply);
      await storeInteraction(sessionId, userMessage, fullReply, tapaMentionedId);
    } catch (err) {
      logger.warn('Post-stream persistence failed (non-critical)', { error: err });
    }
  });
}

// ── Exportar tipos del resto de servicios para que el endpoint no necesite
//    importar de varios sitios ─────────────────────────────────────────────────
export type { VenueState }               from './venueState.service';
export type { ReservaNotificacion }      from './notifications.service';
export { sendAllNotifications }          from './notifications.service';
export { overrideVenueState }            from './venueState.service';
export { forceFlush as flushMemory }     from './customerMemory.service';
