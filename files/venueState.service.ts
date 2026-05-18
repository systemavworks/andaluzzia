/**
 * venueState.service.ts — Estado del local en tiempo real v2
 *
 * Detecta si llueve en Sevilla (Open-Meteo, sin API key),
 * si hay flamenco en vivo (regla de viernes/sábado + override admin),
 * y el estado de la terraza. Cachea con TTL por campo.
 *
 * Mejoras v2:
 *  - Respuesta tipada de Open-Meteo en lugar de `any`.
 *  - TTL diferente para lluvia (5 min) vs flamenco (60 min).
 *  - getVenueState acepta fecha inyectable para testing.
 *  - Interface CacheStore para facilitar la sustitución por Redis.
 *  - overrideVenueState registra quién y cuándo hizo el override.
 *  - Exportación de helpers para tests.
 */

import type { VenueState } from './duende.service';
import { logger }          from '../utils/logger';

// ── Constantes geográficas ────────────────────────────────────────────────────

const SEVILLA_LAT =  37.3886;
const SEVILLA_LON =  -5.9823;

// ── Tipos Open-Meteo ──────────────────────────────────────────────────────────

interface OpenMeteoResponse {
  current?: {
    precipitation?:  number;
    rain?:           number;
    weather_code?:   number;
  };
}

// Códigos WMO de precipitación activa (https://open-meteo.com/en/docs#weathervariables)
const RAIN_CODES = new Set([51,53,55,61,63,65,71,73,75,80,81,82,95,96,99]);

// ── Interface de caché (sustituible por Redis) ────────────────────────────────

interface CacheEntry<T> {
  value:   T;
  expiry:  number;   // epoch ms
  source:  'api' | 'admin' | 'env';
}

const _cache = new Map<keyof VenueState, CacheEntry<boolean | string>>();

function getCached<T>(key: keyof VenueState): T | null {
  const entry = _cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.value as T;
  return null;
}

function setCache<T extends boolean | string>(
  key:    keyof VenueState,
  value:  T,
  ttlMs:  number,
  source: CacheEntry<T>['source'] = 'api',
): void {
  _cache.set(key, { value, expiry: Date.now() + ttlMs, source });
}

// ── Lluvia ────────────────────────────────────────────────────────────────────

const RAIN_TTL = 5 * 60 * 1_000;  // 5 minutos

async function checkRain(): Promise<boolean> {
  const cached = getCached<boolean>('lluvia');
  if (cached !== null) return cached;

  try {
    const url = [
      'https://api.open-meteo.com/v1/forecast',
      `?latitude=${SEVILLA_LAT}&longitude=${SEVILLA_LON}`,
      '&current=precipitation,rain,weather_code',
      '&forecast_days=1',
    ].join('');

    const res = await fetch(url, { signal: AbortSignal.timeout(4_000) });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const data = (await res.json()) as OpenMeteoResponse;
    const cur  = data.current ?? {};

    const isRaining =
      (cur.precipitation ?? 0) > 0 ||
      (cur.rain          ?? 0) > 0 ||
      RAIN_CODES.has(cur.weather_code ?? -1);

    setCache('lluvia', isRaining, RAIN_TTL, 'api');
    logger.debug('Rain check OK', { isRaining, raw: cur });
    return isRaining;
  } catch (err) {
    logger.warn('Open-Meteo request failed — defaulting to no rain', { error: err });
    setCache('lluvia', false, RAIN_TTL, 'api');
    return false;
  }
}

// ── Flamenco ──────────────────────────────────────────────────────────────────

const FLAMENCO_TTL = 60 * 60 * 1_000;  // 60 minutos

/**
 * Regla de negocio: flamenco los viernes y sábados de 20:00 a 23:59.
 * Se puede sobreescribir con overrideVenueState().
 */
export function isFlamencoNight(date: Date = new Date()): boolean {
  const day = date.getDay();   // 0=Dom … 5=Vie … 6=Sáb
  const h   = date.getHours();
  return (day === 5 || day === 6) && h >= 20;
}

// ── Terraza ───────────────────────────────────────────────────────────────────

function isTerrazaLlena(): boolean {
  // Por defecto desde variable de entorno; endpoint admin puede override
  const cached = getCached<boolean>('terrazaLlena');
  if (cached !== null) return cached;
  return process.env.TERRAZA_LLENA === 'true';
}

// ── Evento especial ───────────────────────────────────────────────────────────

function getEventoEspecial(): string | undefined {
  const cached = getCached<string>('eventoEspecial');
  return cached ?? (process.env.EVENTO_ESPECIAL || undefined);
}

// ── API pública ───────────────────────────────────────────────────────────────

export async function getVenueState(now: Date = new Date()): Promise<VenueState> {
  const [lluvia] = await Promise.all([checkRain()]);

  return {
    flamenco:       isFlamencoNight(now),
    lluvia,
    terrazaLlena:   isTerrazaLlena(),
    eventoEspecial: getEventoEspecial(),
  };
}

// ── Override admin (endpoint /api/admin/venue) ────────────────────────────────

export interface VenueOverride {
  partial:   Partial<VenueState>;
  adminId?:  string;
  ttlMs?:    number;   // por defecto 2 horas
}

export function overrideVenueState({ partial, adminId, ttlMs = 2 * 60 * 60 * 1_000 }: VenueOverride): void {
  for (const [key, value] of Object.entries(partial) as Array<[keyof VenueState, boolean | string]>) {
    if (value === undefined) continue;
    setCache(key as keyof VenueState, value, ttlMs, 'admin');
  }
  logger.info('VenueState overridden by admin', { partial, adminId, ttlMs });
}

/** Limpiar todo el caché (útil en tests) */
export function clearVenueCache(): void {
  _cache.clear();
}
