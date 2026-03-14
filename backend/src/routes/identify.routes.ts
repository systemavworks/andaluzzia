/**
 * identify.routes.ts — POST /api/curro/identify
 *
 * Acepta una foto (base64) de una tapa y usa Claude Vision para identificarla,
 * luego hace búsqueda difusa en la carta y devuelve precio + maridaje.
 *
 * Modelo: claude-3-5-sonnet-20241022 (vision-capable)
 * Rate limit: 10 req/min por IP (separado del chat)
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import Anthropic  from '@anthropic-ai/sdk';
import { supabase } from '../config/supabase';
import { logger }   from '../utils/logger';

const router    = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_VISION = 'claude-3-5-sonnet-20241022';

// Rate limit específico para la cámara (más restrictivo que el del chat)
const identifyLimiter = rateLimit({
  windowMs:         60_000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Demasiadas fotos, arma. Espera un momentito.' },
});

// ── Tipos ──────────────────────────────────────────────────────────────────
interface TapaIdentification {
  nombre_posible:        string;
  ingredientes_visibles: string[];
  categoria:             'frías' | 'calientes' | 'pescaíto' | 'carnes' | 'postres';
  confidence:            number;
}

interface TapaConMaridaje {
  id:           number;
  nombre:       string;
  precio:       number;
  descripcion:  string;
  alergenos?:   string[];
  vino_nombre?: string;
  vino_tipo?:   string;
  maridaje_recomendacion?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extrae el JSON del texto que devuelve Claude (puede venir entre ```json…```) */
function parseVisionResponse(text: string): TapaIdentification | null {
  try {
    const clean = text.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    const first = clean.indexOf('{');
    const last  = clean.lastIndexOf('}');
    if (first === -1 || last === -1) return null;
    return JSON.parse(clean.slice(first, last + 1)) as TapaIdentification;
  } catch {
    return null;
  }
}

/** Busca la tapa en BD con fuzzy matching via función SQL */
async function findTapaInDB(nombrePosible: string): Promise<TapaConMaridaje | null> {
  try {
    // Función SQL definida en la migración 002_memoria_curro.sql
    const { data, error } = await supabase.rpc('fuzzy_search_tapas', {
      query_name: nombrePosible.slice(0, 100),
    });
    if (error || !data || data.length === 0) return null;

    const tapa = data[0] as { id: number; nombre: string; precio: number; descripcion: string; alergenos?: string[] };

    // Obtener maridaje si existe
    const { data: maridajeData } = await supabase
      .from('tapas')
      .select('maridaje, vinos(nombre, tipo)')
      .eq('id', tapa.id)
      .maybeSingle();

    return {
      ...tapa,
      vino_nombre:            (maridajeData?.vinos as any)?.nombre,
      vino_tipo:              (maridajeData?.vinos as any)?.tipo,
      maridaje_recomendacion: maridajeData?.maridaje,
    };
  } catch {
    return null;
  }
}

/** Log analítico no bloqueante */
async function logCameraUse(
  sessionId:     string,
  nombreDetectado: string,
  confidence:    number,
  tapaId?:       number,
  success?:      boolean,
): Promise<void> {
  try {
    await supabase.from('identificaciones_camara').insert({
      session_id:       sessionId,
      nombre_detectado: nombreDetectado,
      confidence_score: confidence,
      tapa_encontrada:  tapaId   ?? null,
      exito:            success  ?? false,
    });
  } catch { /* analytics, no crítico */ }
}

// ── Handler ────────────────────────────────────────────────────────────────
router.post('/identify', identifyLimiter, async (req: Request, res: Response) => {
  const { image, sessionId } = req.body as {
    image?:     string;
    sessionId?: string;
  };

  // ── Validación ─────────────────────────────────────────────────────────
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    res.status(400).json({ error: 'Se espera un campo "image" en formato data URL (data:image/...).' });
    return;
  }

  const sid = typeof sessionId === 'string' ? sessionId.slice(0, 64) : 'anon';

  // Extraer base64 real (quitar el prefijo data:image/...;base64,)
  const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!base64Match) {
    res.status(400).json({ error: 'Formato de imagen inválido.' });
    return;
  }
  const mediaType  = base64Match[1] === 'png' ? 'image/png' : 'image/jpeg';
  const base64Data = base64Match[2];

  // Restricción de tamaño: ~1 MB en base64 ≈ ~750 KB real
  if (base64Data.length > 1_400_000) {
    res.status(413).json({ error: 'Imagen demasiado grande. Máx ~1 MB.' });
    return;
  }

  try {
    // ── Llamada a Claude Vision ─────────────────────────────────────────
    const visionResponse = await anthropic.messages.create({
      model:      MODEL_VISION,
      max_tokens: 250,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Eres un experto en gastronomía sevillana. Identifica esta tapa o plato sevillano en la foto. Responde ÚNICAMENTE con un objeto JSON (sin markdown, sin texto adicional) con este formato exacto: {"nombre_posible":"...","ingredientes_visibles":["..."],"categoria":"frías|calientes|pescaíto|carnes|postres","confidence":0.0}. Confidence es de 0.0 a 1.0 según tu certeza.',
            },
            {
              type: 'image',
              source: {
                type:       'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png',
                data:       base64Data,
              },
            },
          ],
        },
      ],
    });

    const rawText = visionResponse.content[0].type === 'text' ? visionResponse.content[0].text : '';
    logger.debug('Vision response', { sid, raw: rawText.slice(0, 200) });

    const identification = parseVisionResponse(rawText);

    if (!identification) {
      res.json({
        fallback:   true,
        suggestion: 'No he podío identificar eso clarito. ¿Me dices qué tapa es, miarma?',
      });
      return;
    }

    const { nombre_posible, ingredientes_visibles, categoria, confidence } = identification;

    // ── Búsqueda en carta si hay suficiente confianza ──────────────────
    if (confidence >= 0.55) {
      const tapa = await findTapaInDB(nombre_posible);
      void logCameraUse(sid, nombre_posible, confidence, tapa?.id, !!tapa);

      if (tapa) {
        res.json({
          tapa_id:     tapa.id,
          nombre:      tapa.nombre,
          precio:      tapa.precio,
          descripcion: tapa.descripcion,
          alergenos:   tapa.alergenos,
          maridaje:    tapa.maridaje_recomendacion || null,
          vino:        tapa.vino_nombre
            ? { nombre: tapa.vino_nombre, tipo: tapa.vino_tipo }
            : null,
          confidence,
          ingredientes_visibles,
          categoria,
          fallback: false,
        });
        return;
      }
    }

    // ── Identificación parcial (sin coincidencia en carta) ──────────────
    void logCameraUse(sid, nombre_posible, confidence, undefined, false);
    res.json({
      fallback:              false,
      sin_match:             true,
      nombre_detectado:      nombre_posible,
      ingredientes_visibles,
      categoria,
      confidence,
      suggestion:            `Parece que podría ser ${nombre_posible}, pero no lo tengo en la carta junto a mí ahora mismo. ¡Pregúntame y te lo cuento todo!`,
    });
  } catch (error) {
    logger.error('Error en /api/curro/identify', { error });
    res.status(500).json({
      fallback:   true,
      suggestion: 'Uy miarma, algo se ha liado en la cocina. Inténtalo de nuevo.',
    });
  }
});

export default router;
