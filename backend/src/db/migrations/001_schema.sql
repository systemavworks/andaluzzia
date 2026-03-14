-- ============================================================
-- Andaluzzia — Supabase Schema (PostgreSQL)
-- Versión: 2026-03 | Pegar en el SQL Editor de Supabase
-- ============================================================

-- Extensión para embeddings RAG (activar en Supabase > Extensions)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. TAPAS (carta principal) ──────────────────────────────────────────────
CREATE TABLE tapas (
    id              SERIAL PRIMARY KEY,
    nombre          TEXT NOT NULL,
    precio          NUMERIC(5,2) NOT NULL,
    descripcion     TEXT CHECK (length(descripcion) <= 180),   -- corta obligatorio → ahorra tokens
    ingredientes    TEXT[],
    alergenos       TEXT[],
    categoria       TEXT CHECK (categoria IN (
                        'frías','calientes','pescaíto','carnes',
                        'postres','bebidas','especiales')),
    popular         BOOLEAN DEFAULT FALSE,
    es_recomendado  BOOLEAN DEFAULT FALSE,   -- aparece en "lo más pedido"
    es_plato_dia    BOOLEAN DEFAULT FALSE,   -- solo 1 activo a la vez
    es_lo_mas_rico  BOOLEAN DEFAULT FALSE,   -- selección especial del maitre
    maridaje        TEXT CHECK (length(maridaje) <= 120),
    origen          TEXT CHECK (length(origen) <= 200),      -- historia breve del plato
    foto_url        TEXT,
    disponible      BOOLEAN DEFAULT TRUE,
    orden           SMALLINT DEFAULT 99,
    embedding       VECTOR(1536),            -- text-embedding-3-small / voyage-3-lite
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. VINOS (maridajes rápidos) ────────────────────────────────────────────
CREATE TABLE vinos (
    id                SERIAL PRIMARY KEY,
    nombre            TEXT NOT NULL,
    tipo              TEXT CHECK (tipo IN (
                          'fino','manzanilla','blanco','tinto crianza',
                          'tinto reserva','rosado','cerveza','refresco')),
    precio_copa       NUMERIC(4,2),
    descripcion_corta TEXT CHECK (length(descripcion_corta) <= 120),
    disponible        BOOLEAN DEFAULT TRUE
);

-- ── 3. MARIDAJES (muchos-a-muchos simplificado) ─────────────────────────────
CREATE TABLE maridajes (
    tapa_id       INT REFERENCES tapas(id) ON DELETE CASCADE,
    vino_id       INT REFERENCES vinos(id) ON DELETE CASCADE,
    recomendacion TEXT CHECK (length(recomendacion) <= 100),  -- "va de lujo con gambas"
    PRIMARY KEY (tapa_id, vino_id)
);

-- ── 4. RESERVAS ─────────────────────────────────────────────────────────────
CREATE TABLE reservas (
    id              SERIAL PRIMARY KEY,
    fecha           DATE NOT NULL,
    hora            TIME NOT NULL,
    personas        SMALLINT NOT NULL CHECK (personas BETWEEN 1 AND 20),
    nombre_cliente  TEXT NOT NULL,
    email           TEXT,
    telefono        TEXT NOT NULL,
    notas           TEXT CHECK (length(notas) <= 200),
    zona            TEXT CHECK (zona IN ('interior','terraza','barra','privado')),
    estado          TEXT DEFAULT 'pendiente' CHECK (
                        estado IN ('pendiente','confirmada','cancelada','completada')),
    confirmada      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. CLIENTES (memoria básica pa fidelidad) ───────────────────────────────
CREATE TABLE clientes (
    id            SERIAL PRIMARY KEY,
    telefono      TEXT UNIQUE NOT NULL,   -- clave pa identificar rápido
    nombre        TEXT,
    email         TEXT,
    preferencias  TEXT[],                 -- ['picante','sin gluten','terraza']
    ultima_visita DATE,
    notas         TEXT CHECK (length(notas) <= 300),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. MESAS ────────────────────────────────────────────────────────────────
CREATE TABLE mesas (
    id        SERIAL PRIMARY KEY,
    numero    SMALLINT UNIQUE NOT NULL,
    zona      TEXT NOT NULL CHECK (zona IN ('interior','terraza','barra','privado')),
    capacidad SMALLINT NOT NULL CHECK (capacidad BETWEEN 1 AND 20),
    activa    BOOLEAN DEFAULT TRUE,
    notas     TEXT
);

-- ── 7. HORARIOS ESPECIALES ──────────────────────────────────────────────────
CREATE TABLE horarios_especiales (
    id            SERIAL PRIMARY KEY,
    fecha         DATE NOT NULL UNIQUE,
    descripcion   TEXT NOT NULL,
    tipo          TEXT NOT NULL CHECK (tipo IN ('cierre','horario_reducido','evento')),
    hora_apertura TIME,
    hora_cierre   TIME,
    activo        BOOLEAN DEFAULT TRUE
);

-- ── Trigger updated_at automático en tapas ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tapas_updated_at
    BEFORE UPDATE ON tapas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Índices (rendimiento crítico) ──────────────────────────────────────────
CREATE INDEX idx_tapas_categoria     ON tapas(categoria);
CREATE INDEX idx_tapas_disponible    ON tapas(disponible) WHERE disponible = TRUE;
CREATE INDEX idx_tapas_popular       ON tapas(popular)    WHERE popular    = TRUE;
CREATE INDEX idx_tapas_plato_dia     ON tapas(es_plato_dia) WHERE es_plato_dia = TRUE;
CREATE INDEX idx_reservas_fecha_hora ON reservas(fecha, hora);
CREATE INDEX idx_reservas_estado     ON reservas(estado);
CREATE INDEX idx_clientes_telefono   ON clientes(telefono);
CREATE INDEX idx_mesas_zona          ON mesas(zona);

-- ── Row Level Security (recomendado en Supabase) ───────────────────────────
-- Habilitar RLS y crear policies según tu caso de uso.
-- Para uso solo desde backend con SERVICE_ROLE_KEY no es bloqueante.
ALTER TABLE tapas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE maridajes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_especiales ENABLE ROW LEVEL SECURITY;

-- Policy: solo el service role puede leer/escribir todo (backend)
-- El cliente JS usa SERVICE_ROLE_KEY → bypassa RLS automáticamente
-- Si quisieras exponer tapas como públicas (para la app):
-- CREATE POLICY "tapas_public_read" ON tapas FOR SELECT USING (disponible = TRUE);
