/**
 * database.ts — Verificación de conectividad con Supabase al arrancar.
 * El cliente Supabase real está en config/supabase.ts.
 */
export { checkSupabaseConnection as connectDB } from './supabase';
