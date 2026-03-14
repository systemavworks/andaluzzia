-- ============================================================
-- Andaluzzia — Supabase Migration 002
-- Versión: 2026-03  |  Pegar en SQL Editor DESPUÉS de 001
-- ============================================================

-- Extensión pg_trgm para fuzzy search de nombres de tapas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── INTERACCIONES DE CURRO (memoria a largo plazo) ──────────────────────────
CREATE TABLE interacciones_curro (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      TEXT NOT NULL,
    user_message    TEXT NOT NULL,
    curro_response  TEXT NOT NULL,
    tapa_mentioned  INT REFERENCES tapas(id) ON DELETE SET NULL,
    reserva_id      INT REFERENCES reservas(id) ON DELETE SET NULL,
    sentiment_score FLOAT CHECK (sentiment_score BETWEEN -1 AND 1),
    venue_state     JSONB,  -- {"flamenco":bool,"lluvia":bool}
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    -- Embedding para búsqueda semántica de conversaciones
    conversation_embedding VECTOR(1536)
);

CREATE INDEX idx_interacciones_session_time
    ON interacciones_curro(session_id, created_at DESC);

CREATE INDEX idx_interacciones_tapa
    ON interacciones_curro(tapa_mentioned)
    WHERE tapa_mentioned IS NOT NULL;

-- Índice IVFFlat para búsqueda vectorial (activar tras tener >1000 filas)
-- CREATE INDEX idx_interacciones_embedding
--     ON interacciones_curro USING ivfflat (conversation_embedding vector_cosine_ops)
--     WITH (lists = 100);

-- ── IDENTIFICACIONES POR CÁMARA (logs para analytics) ──────────────────────
CREATE TABLE identificaciones_camara (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  TEXT,
    tapa_id     INT REFERENCES tapas(id) ON DELETE SET NULL,
    confidence  FLOAT,
    fallback    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_identificaciones_tapa ON identificaciones_camara(tapa_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE interacciones_curro    ENABLE ROW LEVEL SECURITY;
ALTER TABLE identificaciones_camara ENABLE ROW LEVEL SECURITY;

-- ── FUNCIÓN: fuzzy_search_tapas ─────────────────────────────────────────────
-- Búsqueda difusa por nombre de tapa para el multimodal RAG
CREATE OR REPLACE FUNCTION fuzzy_search_tapas(query_name TEXT)
RETURNS TABLE (
    id          INT,
    nombre      TEXT,
    descripcion TEXT,
    precio      NUMERIC,
    categoria   TEXT,
    alergenos   TEXT[],
    maridaje    TEXT,
    similarity  FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.nombre,
        t.descripcion,
        t.precio,
        t.categoria,
        t.alergenos,
        t.maridaje,
        similarity(t.nombre, query_name) AS similarity
    FROM tapas t
    WHERE
        t.disponible = TRUE
        AND (
            similarity(t.nombre, query_name) > 0.2
            OR t.nombre ILIKE '%' || query_name || '%'
        )
    ORDER BY similarity(t.nombre, query_name) DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── FUNCIÓN: get_customer_memory ─────────────────────────────────────────────
-- Recupera recuerdos relevantes de un cliente para personalizar a Curro
CREATE OR REPLACE FUNCTION get_customer_memory(
    p_session_id         TEXT,
    p_query_embedding    VECTOR(1536),
    p_limit              INT DEFAULT 3
)
RETURNS TABLE (
    tapa_nombre    TEXT,
    preferencia    TEXT,
    last_mentioned DATE,
    relevance      FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.nombre AS tapa_nombre,
        CASE
            WHEN i.sentiment_score >  0.4 THEN 'le encantó'
            WHEN i.sentiment_score < -0.4 THEN 'no le gustó'
            ELSE 'mencionó'
        END AS preferencia,
        DATE(i.created_at) AS last_mentioned,
        CASE
            WHEN i.conversation_embedding IS NOT NULL
            THEN 1 - (i.conversation_embedding <=> p_query_embedding)
            ELSE 0.5
        END AS relevance
    FROM interacciones_curro i
    LEFT JOIN tapas t ON i.tapa_mentioned = t.id
    WHERE
        i.session_id = p_session_id
        AND (
            i.conversation_embedding IS NULL
            OR 1 - (i.conversation_embedding <=> p_query_embedding) > 0.65
        )
    ORDER BY relevance DESC, i.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── FUNCIÓN: get_daily_metrics (para dashboard futuro) ──────────────────────
CREATE OR REPLACE FUNCTION get_daily_metrics(p_date DATE)
RETURNS TABLE (
    total_interactions BIGINT,
    camera_uses        BIGINT,
    pairing_suggestions BIGINT,
    avg_sentiment      FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM interacciones_curro
         WHERE DATE(created_at) = p_date) AS total_interactions,
        (SELECT COUNT(*) FROM identificaciones_camara
         WHERE DATE(created_at) = p_date) AS camera_uses,
        (SELECT COUNT(*) FROM interacciones_curro
         WHERE DATE(created_at) = p_date AND tapa_mentioned IS NOT NULL) AS pairing_suggestions,
        (SELECT COALESCE(AVG(sentiment_score), 0) FROM interacciones_curro
         WHERE DATE(created_at) = p_date) AS avg_sentiment;
END;
$$ LANGUAGE plpgsql STABLE;
