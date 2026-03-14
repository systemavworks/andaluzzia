/**
 * duende.service.ts — Modo Duende Adaptativo
 *
 * Detecta el estilo del usuario y genera un contexto dinámico que Curro
 * inyecta en su prompt para adaptar personalidad, volumen de texto y tono.
 *
 * Totalmente en TypeScript, sin dependencias externas.
 */

export type TimeMode = 'mañanero' | 'almuerzo' | 'merienda' | 'noche' | 'madruga';
export type Familiarity = 'nuevo' | 'conocido' | 'asiduo' | 'familia';
export type Brevity = 'corto' | 'normal' | 'detallado';

export interface DuendeConfig {
  andaluzIntensity:     number;       // 0.0 neutro → 1.0 cerrao del to
  timeMode:             TimeMode;
  venueState:           VenueState;
  customerFamiliarity:  Familiarity;
  responseBrevity:      Brevity;
}

export interface VenueState {
  flamenco:     boolean;  // hay actuación en vivo
  lluvia:       boolean;  // está lloviendo en Sevilla
  terrazaLlena: boolean;  // terraza casi llena (>85%)
}

export interface UserStyle {
  andaluzScore: number;   // 0.0-1.0 cuánto habla como andaluz
  urgency:      'normal' | 'high';
  mood:         'neutral' | 'excited' | 'down';
}

// ── Detección de estilo del usuario ──────────────────────────────────────────
const ANDALUZ_WORDS = [
  'quillo', 'quilla', 'miarma', 'arma', 'ole', 'venga', 'na', 'pa', 'to',
  'erse', 'joé', 'coño', 'anda', 'joder', 'hostia', 'tíos', 'macho',
  'mola', 'guay', 'bueno', 'claro', 'pues', 'vamos', 'porfa', 'qué tal',
];

const URGENCY_WORDS = ['rápido', 'prisa', 'ya', 'urgente', 'deprisa', 'volando', 'pronto'];

export function detectUserStyle(message: string): UserStyle {
  const lower = message.toLowerCase();

  const andaluzScore = Math.min(
    1.0,
    ANDALUZ_WORDS.filter(w => lower.includes(w)).length / 5,
  );

  const urgency: UserStyle['urgency'] = URGENCY_WORDS.some(w => lower.includes(w))
    ? 'high' : 'normal';

  let mood: UserStyle['mood'] = 'neutral';
  if (/😍|🤩|!!|\bgenial\b|\bincreíble\b|\bfantástico\b/.test(message)) mood = 'excited';
  else if (/😞|😔|no me gusta|\bmal\b|\bregular\b/.test(lower)) mood = 'down';

  return { andaluzScore, urgency, mood };
}

// ── Hora del día → mode de Curro ─────────────────────────────────────────────
export function getTimeMode(): TimeMode {
  const h = new Date().getHours();
  if (h >= 7  && h < 12) return 'mañanero';
  if (h >= 12 && h < 16) return 'almuerzo';
  if (h >= 16 && h < 20) return 'merienda';
  if (h >= 20 && h < 23) return 'noche';
  return 'madruga';
}

// Saludo de Curro según la hora
const TIME_OPENING: Record<TimeMode, string> = {
  mañanero:  '¡Buenas, arma! Tempranito nos ponemos.',
  almuerzo:  '¡Buenas miarma! Que hay hambre hoy, ¿eh?',
  merienda:  '¡Buenas tardes, quillo! ¿algo pa merendar?',
  noche:     '¡Buenas noches! La noche sevillana está que arde.',
  madruga:   '¡Con la madrugá y todavía con ganas de tapas! Ole tus huevos, miarma.',
};

// ── Construir el bloque de contexto dinámico ─────────────────────────────────
export function buildDuendeContext(
  userStyle:  UserStyle,
  config:     DuendeConfig,
  memories:   string[],   // recuerdos relevantes del cliente
): string {
  const lines: string[] = [];

  // Nivel de andaluz ajustado dinámicamente
  const intensity = userStyle.andaluzScore > 0.5
    ? Math.min(1.0, config.andaluzIntensity + 0.15)
    : Math.max(0.6, config.andaluzIntensity - 0.1);

  // Brevedad según urgencia o modo
  let brevityNote: string;
  if (userStyle.urgency === 'high' || config.responseBrevity === 'corto') {
    brevityNote = '⚡ MÁXIMO 1 FRASE. El cliente tiene prisa.';
  } else if (config.responseBrevity === 'detallado') {
    brevityNote = '💡 Puedes extenderte 2-3 frases si el cliente parece curioso.';
  } else {
    brevityNote = '📏 2-4 frases. Ni muy corto ni muy largo.';
  }

  // Estado del local
  if (config.venueState.flamenco) {
    lines.push('🎵 Hay actuación de flamenco ahora mismo. Cuéntalo si viene al caso, con alegría.');
  }
  if (config.venueState.lluvia) {
    lines.push('🌧️ Está lloviendo en Sevilla. Sugiere platos de cuchara (puchero, caldito) o sitio cubierto.');
  }
  if (config.venueState.terrazaLlena) {
    lines.push('🪑 La terraza está casi llena. Ofrece barra o interior con mucho cariño.');
  }

  // Hora del día
  lines.push(`🕐 HORA: ${config.timeMode} — El saludo natural sería: "${TIME_OPENING[config.timeMode]}"`);

  // Estado de ánimo del cliente
  if (userStyle.mood === 'excited') {
    lines.push('😍 El cliente está entusiasmado. Comparte su energía, dale vidilla.');
  } else if (userStyle.mood === 'down') {
    lines.push('😔 El cliente parece un poco bajo. Sé especialmente cálido y anímale con algo rico.');
  }

  // Familiaridad
  if (config.customerFamiliarity === 'asiduo') {
    lines.push('👋 Cliente asiduo. Usa confianza máxima: "¿Lo de siempre, miarma?" o recuerda sus gustos.');
  } else if (config.customerFamiliarity === 'familia') {
    lines.push('👨‍👩‍👧 Es de la \'familia\' Andaluzzia. Trátalo como colega de toda la vida.');
  }

  // Memoria del cliente
  if (memories.length > 0) {
    lines.push(`🧠 RECUERDOS DEL CLIENTE:\n${memories.map(m => `  ${m}`).join('\n')}`);
  }

  return `
[CONTEXTO DUENDE — SOLO PARA CURRO, NUNCA MENCIONAR AL CLIENTE]
- Intensidad andaluz: ${intensity.toFixed(2)}/1.0
${lines.map(l => `- ${l}`).join('\n')}
- ${brevityNote}
- REGLA DE ORO: Nunca digas "la base de datos dice" o "el sistema recomienda". Di: "Yo te digo", "Mira, en la cocina hoy...", "Te lo juro por mi madre que esto está de muerte".
`.trim();
}
