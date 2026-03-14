/**
 * customerMemory.service.ts — Memoria Persistente con Salero
 *
 * Guarda interacciones en Supabase y recupera recuerdos relevantes
 * para personalizar las respuestas de Curro.
 *
 * Embeddings: text-embedding-3-small (OpenAI) o desactivado si no hay key.
 * Sin clave OpenAI funciona igualmente pero sin búsqueda semántica (solo recencia).
 */

import { supabase } from '../config/supabase';
import { logger }   from '../utils/logger';

// Palabras positivas y negativas para análisis de sentimiento rápido
const POSITIVE = ['bien', 'rico', 'riquísimo', 'bueno', 'guapo', 'ole', 'encanta', 'repetir', 'volver', 'pedimos', 'de lujo', 'de muerte', 'genial'];
const NEGATIVE = ['mal', 'malo', 'malo', 'no me gusta', 'asqueroso', 'no vuelvo', 'frío', 'pasado', 'soso', 'horrible'];

function quickSentiment(text: string): number {
  const lower = text.toLowerCase();
  const pos = POSITIVE.filter(w => lower.includes(w)).length;
  const neg = NEGATIVE.filter(w => lower.includes(w)).length;
  if (pos + neg === 0) return 0;
  return parseFloat(((pos - neg) / (pos + neg)).toFixed(2));
}

// ── Embeddings (opcional — requiere OPENAI_API_KEY) ────────────────────────
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;      // sin key → sin embedding
  try {
    // Importación dinámica para no bloqueear si no está instalado
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.embeddings.create({
      model:      'text-embedding-3-small',
      input:      text.slice(0, 8191),
      dimensions: 1536,
    });
    return r.data[0].embedding;
  } catch (e) {
    logger.warn('Embedding generation failed, continuando sin él', { error: e });
    return null;
  }
}

// ── Recuperar memoria relevante del cliente ──────────────────────────────
export async function getRelevantMemory(
  sessionId:    string,
  currentQuery: string,
): Promise<string[]> {
  try {
    const embedding = await generateEmbedding(currentQuery);

    let rows: Array<{ tapa_nombre: string; preferencia: string; last_mentioned: string }> = [];

    if (embedding) {
      // Búsqueda semántica via función SQL
      const { data } = await supabase.rpc('get_customer_memory', {
        p_session_id:      sessionId,
        p_query_embedding: embedding,
        p_limit:           3,
      });
      rows = data ?? [];
    } else {
      // Fallback: últimas 3 tapas mencionadas (sin embedding)
      const { data } = await supabase
        .from('interacciones_curro')
        .select('tapa_mentioned, created_at, sentiment_score, tapas(nombre)')
        .eq('session_id', sessionId)
        .not('tapa_mentioned', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);

      rows = (data ?? []).map((r: any) => ({
        tapa_nombre:    r.tapas?.nombre ?? '',
        preferencia:    r.sentiment_score > 0.4 ? 'le encantó' : r.sentiment_score < -0.4 ? 'no le gustó' : 'mencionó',
        last_mentioned: new Date(r.created_at).toLocaleDateString('es-ES'),
      }));
    }

    return rows
      .filter(r => r.tapa_nombre)
      .map(r => `${r.tapa_nombre}: ${r.preferencia} (${r.last_mentioned})`);
  } catch (e) {
    logger.warn('getRelevantMemory falló, continuando sin memoria', { error: e });
    return [];
  }
}

// ── Determinar familiaridad del cliente ──────────────────────────────────────
export async function getCustomerFamiliarity(
  sessionId: string,
): Promise<'nuevo' | 'conocido' | 'asiduo' | 'familia'> {
  try {
    const { count } = await supabase
      .from('interacciones_curro')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if ((count ?? 0) >= 30) return 'familia';
    if ((count ?? 0) >= 10) return 'asiduo';
    if ((count ?? 0) >= 3)  return 'conocido';
    return 'nuevo';
  } catch {
    return 'nuevo';
  }
}

// ── Guardar interacción en BD ─────────────────────────────────────────────
export async function storeInteraction(
  sessionId:        string,
  userMsg:          string,
  curroResp:        string,
  tapaMentionedId?: number,
  reservaId?:       number,
  venueState?:      object,
): Promise<void> {
  try {
    const conversation   = `Cliente: ${userMsg}\nCurro: ${curroResp}`;
    const sentiment      = quickSentiment(userMsg + ' ' + curroResp);
    const embedding      = await generateEmbedding(conversation);

    await supabase.from('interacciones_curro').insert({
      session_id:               sessionId,
      user_message:             userMsg.slice(0, 500),
      curro_response:           curroResp.slice(0, 500),
      tapa_mentioned:           tapaMentionedId ?? null,
      reserva_id:               reservaId       ?? null,
      sentiment_score:          sentiment,
      venue_state:              venueState ?? null,
      conversation_embedding:   embedding,
    });
  } catch (e) {
    logger.warn('storeInteraction falló (no crítico)', { error: e });
  }
}

// ── Intentar adivinar qué tapa mencionó Curro en la respuesta ─────────────
export async function extractTapaMentionedId(
  curroResponse: string,
): Promise<number | undefined> {
  try {
    const { data: tapas } = await supabase
      .from('tapas')
      .select('id, nombre')
      .eq('disponible', true);

    if (!tapas) return undefined;
    const lower = curroResponse.toLowerCase();
    const found = tapas.find(t => lower.includes(t.nombre.toLowerCase()));
    return found?.id;
  } catch {
    return undefined;
  }
}
