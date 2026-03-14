/**
 * Supabase client — Andaluzzia Backend
 *
 * Usa SERVICE_ROLE_KEY desde el backend (nunca expongas esta key al cliente).
 * Bypassa automáticamente Row Level Security → acceso completo a todas las tablas.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias en .env');
  process.exit(1);
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** Comprueba la conectividad con Supabase al arrancar el server */
export const checkSupabaseConnection = async (): Promise<void> => {
  const { error } = await supabase.from('tapas').select('id').limit(1);
  if (error) throw new Error(`Supabase no disponible: ${error.message}`);
};
