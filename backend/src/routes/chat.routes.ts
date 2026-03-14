/**
 * Ruta POST /api/chat — "El Curro" v2 (Marzo 2026)
 *
 * Arquitectura de tokens controlada:
 *  - System prompt ultra-eficiente (~320 tokens)
 *  - Auto-resumen del historial cuando supera SUMMARY_TRIGGER_TOKENS
 *  - Hard cap SESSION_TOKEN_HARD_CAP por sesión (equiv. ~5 turnos)
 *  - Modelo barato para resúmenes (claude-3-haiku)
 *  - Carta compacta en contexto (ahorra 60-70% vs JSON completo)
 *
 * Estimación de coste (claude-3-5-haiku, precios 2026):
 *   ~1 200 tokens/turno × 200 clientes/día × 5 turnos ≈ < 5 € / día
 */

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { supabase }    from '../config/supabase';
import { chatLimiter } from '../middlewares/rateLimit.middleware';
import { logger }      from '../utils/logger';
import {
  detectUserStyle,
  buildDuendeContext,
  getTimeMode,
  DuendeConfig,
} from '../services/duende.service';
import { getVenueState }        from '../services/venueState.service';
import {
  getRelevantMemory,
  getCustomerFamiliarity,
  storeInteraction,
  extractTapaMentionedId,
} from '../services/customerMemory.service';

const router   = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Modelos: haiku para el chat (barato y rápido), haiku-mini para resúmenes
const MODEL_MAIN    = process.env.ANTHROPIC_MODEL         ?? 'claude-3-5-haiku-20241022';
const MODEL_SUMMARY = process.env.ANTHROPIC_MODEL_SUMMARY ?? 'claude-3-haiku-20240307';

const MAX_TOKENS_RESPONSE     = 220;   // Curro habla corto
const MAX_USER_MSG_CHARS      = 400;
const MAX_MESSAGES_IN_CONV    = 20;
const SESSION_TOKEN_HARD_CAP  = 6800;  // hard limit por sesión
const SUMMARY_TRIGGER_TOKENS  = 800;   // resumir historial al superar este umbral

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; }

interface SessionState {
  tokenCount:   number;   // tokens acumulados en la sesión
  summary:      string;   // resumen comprimido del historial anterior
  lastActivity: number;   // timestamp ms para TTL
}

// ── Memoria de sesión en proceso (reemplaza con Redis en producción) ────────
const sessions = new Map<string, SessionState>();

function getSession(id: string): SessionState {
  const now = Date.now();
  // Limpieza lazy: eliminar sesiones inactivas >2h
  if (sessions.size > 500) {
    for (const [k, v] of sessions) {
      if (now - v.lastActivity > 7_200_000) sessions.delete(k);
    }
  }
  return sessions.get(id) ?? { tokenCount: 0, summary: '', lastActivity: now };
}

/** Estimación aproximada de tokens (chars / 4). No requiere tokenizer externo. */
function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Resumen del historial usando el modelo más barato */
async function buildSummary(messages: Message[]): Promise<string> {
  const hist = messages
    .map(m => `${m.role === 'user' ? 'Cliente' : 'Curro'}: ${m.content}`)
    .join('\n');
  const r = await anthropic.messages.create({
    model:      MODEL_SUMMARY,
    max_tokens: 180,
    system:     'Resume esta conversación de hostelería en máx 120 palabras. Solo hechos clave: platos comentados, preferencias, datos de reserva (nombre/tel/fecha/personas), peticiones especiales.',
    messages:   [{ role: 'user', content: hist }],
  });
  return r.content[0].type === 'text' ? r.content[0].text : '';
}

// ── Carga contexto de Supabase (una vez por petición) ─────────────────────
async function loadContexto() {
  const today = new Date().toISOString().split('T')[0];
  const [
    { data: tapas },
    { data: vinos },
    { data: horario },
    { data: mesas },
  ] = await Promise.all([
    supabase
      .from('tapas')
      .select('nombre, precio, descripcion, categoria, alergenos, maridaje, es_recomendado, es_plato_dia, es_lo_mas_rico, popular')
      .eq('disponible', true)
      .order('orden'),
    supabase
      .from('vinos')
      .select('nombre, tipo, precio_copa, descripcion_corta')
      .eq('disponible', true),
    supabase
      .from('horarios_especiales')
      .select('descripcion, tipo, hora_apertura, hora_cierre')
      .eq('fecha', today)
      .eq('activo', true)
      .maybeSingle(),
    supabase
      .from('mesas')
      .select('capacidad')
      .eq('activa', true),
  ]);
  return {
    tapas:   tapas  ?? [],
    vinos:   vinos  ?? [],
    horario: horario ?? null,
    capacidadTotal: (mesas ?? []).reduce((s, m) => s + (m.capacidad ?? 0), 0),
  };
}

// ── System prompt ultra-eficiente (≈ 320 tokens en input) ─────────────────
function buildSystemPrompt(
  ctx: Awaited<ReturnType<typeof loadContexto>>,
  sessionSummary?: string,
  duendeContext?:  string,
): string {
  const { tapas, vinos, horario, capacidadTotal } = ctx;

  const platoDia  = tapas.find(t => t.es_plato_dia);
  const loMasRico = tapas.filter(t => t.es_lo_mas_rico).slice(0, 4);
  const populares = tapas.filter(t => t.popular).slice(0, 6);

  // Carta compacta: nombre+precio+alergenos → ahorra ~60% tokens vs JSON completo
  const cartaStr = tapas
    .map(t => `${t.nombre}(${t.precio}€)${(t.alergenos?.length) ? `[${t.alergenos.join(',')}]` : ''}`)
    .join(' · ');

  const vinosStr = (vinos ?? [])
    .map(v => `${v.nombre} ${v.tipo} ${v.precio_copa}€`)
    .join(' · ');

  return `Eres Curro, camarero-maître sevillano 48 años en Andaluzzia (Triana, Sevilla). Habla SIEMPRE en andaluz sevillano cerrado: "miarma","guapo/a","venga va","ole","de muerte","pa chuparse los dedos","quillo/quilla". NUNCA español neutro. Responde corto (máx 2-4 frases). NUNCA menciones "base de datos","API" ni "sistema".

Reglas: usa SOLO la carta real pa recomendar. Reservas → deriva al formulario web o llama al 954 00 00 00. Si no estás seguro di "Déjame mirar un segundito…". Simpático, picaíllo, respetuoso.

HORARIO: Mar–Dom 12:00–00:00 | Lun CERRADO | Calle Betis 45 | Aforo: ${capacidadTotal} personas
${horario ? `⚠️ HOY: ${horario.descripcion}${horario.tipo === 'horario_reducido' ? ` (${horario.hora_apertura}–${horario.hora_cierre})` : ''}` : ''}
${platoDia ? `PLATO DÍA: ${platoDia.nombre} ${platoDia.precio}€ — ${platoDia.descripcion}` : ''}
LO MÁS RICO: ${loMasRico.map(t => `${t.nombre}(${t.precio}€)`).join(', ')}
MÁS PEDIDO: ${populares.map(t => t.nombre).join(', ')}
CARTA: ${cartaStr}
BEBIDAS: ${vinosStr}
${sessionSummary ? `\nCONTEXTO PREVIO: ${sessionSummary}` : ''}
Ejemplos:
U: ¿Qué tenéis? C: ¡Buenas miarma! Hoy está de lujo: salmorejo fresquito a 4,50, tortillitas de camarones pa morirse y pringá casera… ¿por dónde empezamos, guapo?
U: Quiero reservar pa 3 a las 21h. C: ¡Pa ti que sí, quillo! Mesa pa tres a las nueve. ¿Nombre y teléfono, arma?
U: Recomiéndame algo con fino. C: Ole corazón, las gambitas al ajillo con fino En Rama son un escándalo. Las tortillitas también van de lujo. ¿Te lo pongo?
${duendeContext ? `\n${duendeContext}` : ''}`;
}

// ── Handler principal ──────────────────────────────────────────────────────
router.post('/', chatLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, sessionId } = req.body as {
      messages:   Message[];
      sessionId?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Mensajes inválidos' });
      return;
    }

    // Sanear sessionId (evitar key injection en el Map)
    const sid     = typeof sessionId === 'string' ? sessionId.slice(0, 64) : `anon_${Date.now()}`;
    const session = getSession(sid);

    // ── Hard cap de sesión ─────────────────────────────────────────────────
    if (session.tokenCount >= SESSION_TOKEN_HARD_CAP) {
      res.json({
        content:      '¡Anda miarma, que llevamos un buen rato! Me alegra haberle atendío. Mañana aquí estará el Curro. ¡Ole y hasta pronto! 🤵',
        limitReached: true,
      });
      return;
    }

    // ── Sanitizar y limitar historial ──────────────────────────────────────
    const safeMessages: Message[] = messages
      .slice(-MAX_MESSAGES_IN_CONV)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role:    m.role,
        content: typeof m.content === 'string' ? m.content.slice(0, MAX_USER_MSG_CHARS) : m.content,
      }));

    // ── Auto-resumen si el historial pesa demasiado ────────────────────────
    const histTokens     = approxTokens(safeMessages.map(m => m.content).join(' '));
    let workingMessages  = safeMessages;
    let updatedSummary   = session.summary;

    if (safeMessages.length > 4 && histTokens > SUMMARY_TRIGGER_TOKENS) {
      try {
        updatedSummary  = await buildSummary(safeMessages.slice(0, -2));
        workingMessages = safeMessages.slice(-2);  // conservar solo los últimos 2 turnos
        logger.debug('Historial resumido', { sid, histTokens });
      } catch (e) {
        logger.warn('Error generando resumen, continuando sin él', { error: e });
      }
    }

    // ── Cargar contexto BD y construir el system prompt ────────────────────
    const ctx       = await loadContexto();

    // ── Duende Adaptativo + Memoria del cliente ────────────────────────────
    const lastUserMsg    = safeMessages.filter(m => m.role === 'user').slice(-1)[0]?.content ?? '';
    const [userStyle, venueState, memories, familiarity] = await Promise.all([
      Promise.resolve(detectUserStyle(lastUserMsg)),
      getVenueState(),
      getRelevantMemory(sid, lastUserMsg),
      getCustomerFamiliarity(sid),
    ]);

    const duendeConfig: DuendeConfig = {
      andaluzIntensity:    0.80,
      timeMode:            getTimeMode(),
      venueState,
      customerFamiliarity: familiarity,
      responseBrevity:     userStyle.urgency === 'high' ? 'corto' : 'normal',
    };

    const duendeContext = buildDuendeContext(userStyle, duendeConfig, memories);
    const systemPrompt  = buildSystemPrompt(ctx, updatedSummary || session.summary, duendeContext);

    // ── Llamada a Claude ───────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model:       MODEL_MAIN,
      max_tokens:  MAX_TOKENS_RESPONSE,
      temperature: 0.85,
      system:      systemPrompt,
      messages:    workingMessages,
    });

    const text       = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    // ── Guardar interacción en memoria (no bloqueante) ─────────────────────
    void extractTapaMentionedId(text).then(tapaId =>
      storeInteraction(sid, lastUserMsg, text, tapaId, undefined, venueState),
    );

    // ── Actualizar estado de sesión ────────────────────────────────────────
    sessions.set(sid, {
      tokenCount:   session.tokenCount + tokensUsed,
      summary:      updatedSummary,
      lastActivity: Date.now(),
    });

    logger.debug('Chat tokens', {
      sid,
      turno:   tokensUsed,
      sesión:  session.tokenCount + tokensUsed,
      modelo:  MODEL_MAIN,
    });

    res.json({
      content:      text,
      sessionId:    sid,
      limitReached: false,
      ...(process.env.NODE_ENV === 'development' && {
        _debug: {
          sessionTokens: session.tokenCount + tokensUsed,
          turnTokens:    tokensUsed,
          model:         MODEL_MAIN,
        },
      }),
    });
  } catch (error) {
    logger.error('Error en /api/chat', { error });
    res.status(500).json({ error: 'El Curro se ha ido un momento a la cocina. Inténtalo de nuevo.' });
  }
});

export default router;
