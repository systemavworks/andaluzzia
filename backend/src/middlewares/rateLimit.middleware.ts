import rateLimit from 'express-rate-limit';

/** Límite general para rutas públicas (menú, info) */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutos
  max:      100,
  message:  { error: 'Demasiadas peticiones. Espera un momento y vuelve a intentarlo.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/** Límite para reservas — evita spam de formularios */
export const reservasLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hora
  max:      10,
  message:  { error: 'Demasiadas reservas desde esta IP. Espera una hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/** Límite para el chat IA — protege el crédito de Anthropic */
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hora
  max:      30,                // 30 mensajes por hora por IP
  message:  { error: 'Has usado mucho al Curro por hoy, arma. Vuelve en un ratito.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
