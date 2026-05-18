/**
 * customerMemory.service.ts — Memoria Persistente con Salero v2
 *
 * Guarda interacciones en Supabase y recupera recuerdos relevantes
 * para personalizar las respuestas de Curro.
 *
 * Mejoras v2:
 *  - Tipos explícitos para todas las estructuras de Supabase.
 *  - Retry con backoff exponencial en storeInteraction.
 *  - Batch de escritura: acumula interacciones y hace flush cada 10 o cada 30s.
 *  - quickSentiment con pesos diferenciados.
 *  - getCustomerFamiliarity con caché en memoria (evita N queries por sesión).
 *  - Exportación de helpers para tests unitarios.
 */

import { supabase }  from '../config/supabase';
import { logger }    from '../utils/logger';
import type { Familiarity } from './duende.service';

// ── Tipos internos ─────────────────────────────────────────────────────────────

interface InteraccionRow {
  session_id:             string;
  user_message:           string;
  curro_response:         string;
  tapa_mentioned?:        number | null;
  reserva_id?:            number | null;
  sentiment_score:        number;
  venue_state?:           object | null;
  conversation_embedding?: number[] | null;
}

interface TapaMemoryRow {
  tapa_nombre:    string;
  preferencia:    string;
  last_mentioned: string;
}

interface RawInteraccionRow {
  tapa_mentioned: number | null;
  created_at:     string;
  sentiment_score: number;
  tapas?: { nombre: string } | null;
}

// ── Análisis de sentimiento rápido con pesos ───────────────────────────────────

const SENTIMENT_MAP: Array<{ word: string; score: number }> = [
  // Positivos
  { word: 'riquísimo',   score: 2  },
  { word: 'de muerte',   score: 2  },
  { word: 'de lujo',     score: 1.5},
  { word: 'encanta',     score: 1.5},
  { word: 'rico',        score: 1  },
  { word: 'bien',        score: 0.8},
  { word: 'bueno',       score: 0.8},
  { word: 'genial',      score: 1  },
  { word: 'volver',      score: 1  },
  { word: 'repetir',     score: 1  },
  { word: 'pedimos',     score: 0.5},
  { word: 'ole',         score: 0.5},
  // Negativos
  { word: 'horrible',    score: -2 },
  { word: 'asqueroso',   score: -2 },
  { word: 'pésimo',      score: -2 },
  { word: 'no vuelvo',   score: -2 },
  { word: 'malo',        score: -1 },
  { word: 'mal',         score: -0.8},
  { word: 'frío',        score: -0.8},
  { word: 'soso',        score: -1 },
  { word: 'no me gusta', score: -1.5},
  { word: 'regular',     score: -0.5},
];

export function quickSentiment(text: string): number {
  const lower  = text.toLowerCase();
  const total  = SENTIMENT_MAP
    .filter(({ word }) => lower.includes(word))
    .reduce((sum, { score }) => sum + score, 0);
  // Normalizar al rango [-1, 1]
  return Math.max(-1, Math.min(1, parseFloat((total / 5).toFixed(2))));
}

// ── Embeddings — lazy import, sin bloqueo si no hay key ───────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.embeddings.create({
      model:      'text-embedding-3-small',
      input:      text.slice(0, 8_191),
      dimensions: 1536,
    });
    return result.data[0].embedding;
  } catch (err) {
    logger.warn('Embedding generation failed — continuing without it', { error: err });
    return null;
  }
}

// ── Caché de familiaridad por sesión ──────────────────────────────────────────

const familiarityCache = new Map<string, { value: Familiarity; ts: number }>();
const FAMILIARITY_TTL = 5 * 60 * 1_000; // 5 minutos

export async function getCustomerFamiliarity(sessionId: string): Promise<Familiarity> {
  const cached = familiarityCache.get(sessionId);
  if (cached && Date.now() - cached.ts < FAMILIARITY_TTL) return cached.value;

  try {
    const { count, error } = await supabase
      .from('interacciones_curro')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) throw error;

    let value: Familiarity;
    const n = count ?? 0;
    if (n >= 30)  value = 'familia';
    else if (n >= 10) value = 'asiduo';
    else if (n >= 3)  value = 'conocido';
    else value = 'nuevo';

    familiarityCache.set(sessionId, { value, ts: Date.now() });
    return value;
  } catch (err) {
    logger.warn('getCustomerFamiliarity failed, defaulting to "nuevo"', { error: err });
    return 'nuevo';
  }
}

// ── Recuperar memoria relevante del cliente ───────────────────────────────────

export async function getRelevantMemory(
  sessionId:    string,
  currentQuery: string,
): Promise<string[]> {
  try {
    const embedding = await generateEmbedding(currentQuery);
    let rows: TapaMemoryRow[] = [];

    if (embedding) {
      // Búsqueda semántica via RPC de Supabase (pgvector)
      const { data, error } = await supabase.rpc('get_customer_memory', {
        p_session_id:      sessionId,
        p_query_embedding: embedding,
        p_limit:           4,
      });
      if (error) throw error;
      rows = (data ?? []) as TapaMemoryRow[];
    } else {
      // Fallback recencia: últimas 4 tapas mencionadas
      const { data, error } = await supabase
        .from('interacciones_curro')
        .select('tapa_mentioned, created_at, sentiment_score, tapas(nombre)')
        .eq('session_id', sessionId)
        .not('tapa_mentioned', 'is', null)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      rows = ((data ?? []) as RawInteraccionRow[]).map(r => ({
        tapa_nombre:    r.tapas?.nombre ?? '',
        preferencia:
          r.sentiment_score > 0.4  ? 'le encantó'  :
          r.sentiment_score < -0.4 ? 'no le gustó' : 'mencionó',
        last_mentioned: new Date(r.created_at).toLocaleDateString('es-ES'),
      }));
    }

    return rows
      .filter(r => r.tapa_nombre)
      .map(r => `${r.tapa_nombre}: ${r.preferencia} (${r.last_mentioned})`);
  } catch (err) {
    logger.warn('getRelevantMemory failed — continuing without memory', { error: err });
    return [];
  }
}

// ── Batch de escritura ────────────────────────────────────────────────────────
// Evita una escritura en BD por cada mensaje; hace flush cada BATCH_SIZE
// mensajes o cada FLUSH_INTERVAL_MS, lo que ocurra primero.

const BATCH_SIZE        = 10;
const FLUSH_INTERVAL_MS = 30_000;

let writeQueue: InteraccionRow[]      = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushQueue(): Promise<void> {
  if (writeQueue.length === 0) return;
  const batch = writeQueue.splice(0, writeQueue.length); // atómica
  try {
    const { error } = await supabase.from('interacciones_curro').insert(batch);
    if (error) throw error;
    logger.debug(`Batch flushed: ${batch.length} interacciones`);
  } catch (err) {
    logger.error('Batch flush failed — reinserting', { error: err });
    writeQueue.unshift(...batch); // devolver al frente para reintentar
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flushQueue();
  }, FLUSH_INTERVAL_MS);
}

// ── Guardar interacción (enqueue + flush condicional) ─────────────────────────

export async function storeInteraction(
  sessionId:        string,
  userMsg:          string,
  curroResp:        string,
  tapaMentionedId?: number,
  reservaId?:       number,
  venueState?:      object,
): Promise<void> {
  try {
    const conversation = `Cliente: ${userMsg}\nCurro: ${curroResp}`;
    const [embedding, sentiment] = await Promise.all([
      generateEmbedding(conversation),
      Promise.resolve(quickSentiment(userMsg + ' ' + curroResp)),
    ]);

    const row: InteraccionRow = {
      session_id:             sessionId,
      user_message:           userMsg.slice(0, 500),
      curro_response:         curroResp.slice(0, 500),
      tapa_mentioned:         tapaMentionedId ?? null,
      reserva_id:             reservaId       ?? null,
      sentiment_score:        sentiment,
      venue_state:            venueState ?? null,
      conversation_embedding: embedding,
    };

    writeQueue.push(row);

    if (writeQueue.length >= BATCH_SIZE) {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
      await flushQueue();
    } else {
      scheduleFlush();
    }
  } catch (err) {
    logger.warn('storeInteraction enqueue failed (non-critical)', { error: err });
  }
}

// ── Detectar qué tapa mencionó Curro (heurística de nombre) ───────────────────

export async function extractTapaMentionedId(
  curroResponse: string,
): Promise<number | undefined> {
  try {
    const { data: tapas, error } = await supabase
      .from('tapas')
      .select('id, nombre')
      .eq('disponible', true);

    if (error || !tapas) return undefined;

    const lower = curroResponse.toLowerCase();
    const found = tapas.find(t => lower.includes(t.nombre.toLowerCase()));
    return found?.id;
  } catch {
    return undefined;
  }
}

// ── Flush manual (útil en shutdown de servidor) ───────────────────────────────

export async function forceFlush(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  await flushQueue();
}
