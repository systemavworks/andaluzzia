/**
 * venueState.service.ts — Estado del local en tiempo real
 *
 * Detecta si llueve en Sevilla (Open-Meteo, sin API key),
 * si hay flamenco en vivo (viernes/sábado noche) y el estado
 * de la terraza. Cachea el resultado 30 minutos.
 *
 * Open-Meteo es gratis y sin registro: https://open-meteo.com/
 */

import { VenueState } from './duende.service';
import { logger }     from '../utils/logger';

// Coordenadas de Sevilla (Triana)
const SEVILLA_LAT = 37.3886;
const SEVILLA_LON = -5.9823;

// ── Cache en memoria (reemplaza con Redis en producción) ───────────────────
let cachedState:  VenueState | null = null;
let cacheExpiry:  number            = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;   // 30 minutos

// ── Comprobar si llueve en Sevilla ────────────────────────────────────────
async function checkRain(): Promise<boolean> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${SEVILLA_LAT}&longitude=${SEVILLA_LON}&current=precipitation,rain,weather_code&forecast_days=1`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { current?: { precipitation?: number; rain?: number } };
    return (data.current?.precipitation ?? 0) > 0 || (data.current?.rain ?? 0) > 0;
  } catch {
    // Si la API falla simplemente no añadimos el hint de lluvia
    return false;
  }
}

// ── Detectar noche de flamenco (viernes/sábado después de 20:00) ───────────
function isFlamencoNight(): boolean {
  const now = new Date();
  const day = now.getDay();   // 0=Dom, 5=Vie, 6=Sáb
  const h   = now.getHours();
  return (day === 5 || day === 6) && h >= 20 && h < 24;
}

// ── API pública (terraza llena se puede fijar con env var o endpoint admin) ─
export async function getVenueState(): Promise<VenueState> {
  const now = Date.now();

  if (cachedState && now < cacheExpiry) {
    return cachedState;
  }

  const [lluvia] = await Promise.all([checkRain()]);

  cachedState = {
    flamenco:     isFlamencoNight(),
    lluvia,
    terrazaLlena: process.env.TERRAZA_LLENA === 'true',
  };
  cacheExpiry = now + CACHE_TTL_MS;

  logger.debug('VenueState actualizado', cachedState);
  return cachedState;
}

/** Sobreescribir estado manualmente (endpoint admin futuro) */
export function overrideVenueState(partial: Partial<VenueState>): void {
  cachedState  = { ...(cachedState ?? { flamenco: false, lluvia: false, terrazaLlena: false }), ...partial };
  cacheExpiry  = Date.now() + CACHE_TTL_MS;
}
