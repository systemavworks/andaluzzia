require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_KEY =
  (SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes('xxxxx'))
    ? SUPABASE_SERVICE_ROLE_KEY
    : SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('xxxxx')) {
  console.error('Faltan credenciales reales en backend/.env (SUPABASE_URL y key de Supabase).');
  process.exit(1);
}

if (SUPABASE_KEY === SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Aviso: usando NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Si RLS bloquea escritura, se necesita SERVICE_ROLE_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const htmlPath = path.resolve(__dirname, '../../frontend/public/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/<script type="application\/json" id="carta-data">([\s\S]*?)<\/script>/);
if (!match) {
  console.error('No se encontró el bloque carta-data en frontend/public/index.html');
  process.exit(1);
}

const parsed = JSON.parse(match[1]);
const tapas = Array.isArray(parsed.tapas) ? parsed.tapas : [];

function mapCategoria(t) {
  const seccion = String(t.seccion || '').toLowerCase();
  const categoria = String(t.categoria || '').toLowerCase();
  if (seccion === 'postres' || categoria.includes('postre')) return 'postres';
  if (seccion === 'marineras' || categoria.includes('mar') || categoria.includes('frituras')) return 'pescaíto';
  if (seccion === 'clasicos' || seccion === 'principales' || categoria.includes('clasico') || categoria.includes('tradicion')) return 'calientes';
  if (seccion === 'frias' || seccion === 'entrantes' || categoria.includes('fria') || categoria.includes('ensalada') || categoria.includes('entrante')) return 'frías';
  return 'especiales';
}

function mapAlergenos(t) {
  const txt = `${t.nombre || ''} ${t.descripcion || ''}`.toLowerCase();
  const set = new Set();
  if (/pan|tosta|brioche|canelon|croqueta|flamenquin/.test(txt)) set.add('gluten');
  if (/queso|bechamel|leche|brie|brownie|coulant/.test(txt)) set.add('lactosa');
  if (/huevo|alioli|mayonesa|cesar/.test(txt)) set.add('huevo');
  if (/gamba|camaron/.test(txt)) set.add('crustáceos');
  if (/atun|bacalao|corvina|boqueron|ceviche/.test(txt)) set.add('pescado');
  if (/mejillon|choco|pulpo/.test(txt)) set.add('moluscos');
  return Array.from(set);
}

function mapIngredientes(t) {
  return String(t.descripcion || '')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);
}

function mapPrecio(value) {
  const n = Number(String(value || '0').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

async function syncCarta() {
  const { data: existentes, error: errorSelect } = await supabase.from('tapas').select('id,nombre');
  if (errorSelect) {
    if (String(errorSelect.message || '').includes("Could not find the table 'public.tapas'")) {
      throw new Error('La tabla public.tapas no existe en este proyecto Supabase. Ejecuta primero backend/src/db/migrations/001_schema.sql y luego backend/src/db/seeds/001_tapas_sevillanas.sql.');
    }
    throw errorSelect;
  }

  const byNombre = new Map((existentes || []).map((r) => [String(r.nombre).toLowerCase().trim(), r.id]));

  let updated = 0;
  let inserted = 0;

  for (let i = 0; i < tapas.length; i += 1) {
    const t = tapas[i] || {};
    const nombre = String(t.nombre || '').trim();
    if (!nombre) continue;

    const row = {
      nombre,
      precio: mapPrecio(t.precio),
      descripcion: String(t.descripcion || '').slice(0, 180),
      ingredientes: mapIngredientes(t),
      alergenos: mapAlergenos(t),
      categoria: mapCategoria(t),
      popular: Boolean(t.destacada_semana || t.etiqueta),
      es_recomendado: Boolean(t.destacada_semana),
      es_lo_mas_rico: Boolean(t.tipo_badge === 'hot' || t.tipo_badge === 'semana'),
      es_plato_dia: Boolean(t.tipo_badge === 'dia'),
      maridaje: t.maridaje ? String(t.maridaje).slice(0, 120) : null,
      origen: `Sincronizado desde frontend/public/index.html (${new Date().toISOString().slice(0, 10)})`.slice(0, 200),
      disponible: t.disponible !== false,
      orden: i + 1,
    };

    const id = byNombre.get(nombre.toLowerCase());
    if (id) {
      const { error } = await supabase.from('tapas').update(row).eq('id', id);
      if (error) throw new Error(`Error actualizando ${nombre}: ${error.message}`);
      updated += 1;
    } else {
      const { error } = await supabase.from('tapas').insert(row);
      if (error) throw new Error(`Error insertando ${nombre}: ${error.message}`);
      inserted += 1;
    }
  }

  console.log(`SYNC_OK updated=${updated} inserted=${inserted} total_json=${tapas.length}`);
}

syncCarta().catch((err) => {
  console.error('SYNC_ERROR', err.message || err);
  process.exit(1);
});
