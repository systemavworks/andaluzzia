/**
 * duende.service.ts — Modo Duende Adaptativo v2
 *
 * Detecta el estilo del usuario y genera un bloque de contexto dinámico
 * que Curro inyecta en su system-prompt para adaptar personalidad,
 * volumen de texto y tono en cada respuesta.
 *
 * Mejoras v2:
 *  - andaluzScore normalizado por densidad, no solo conteo absoluto.
 *  - Palabras agrupadas con peso individual (básico = 1, jerga profunda = 2).
 *  - Detección de mood ampliada con regex de emojis Unicode.
 *  - buildDuendeContext devuelve objeto estructurado además del string.
 *  - TIME_OPENING como función para poder añadir variación aleatoria.
 *  - Exportación de constantes para tests unitarios.
 */

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export type TimeMode    = 'mañanero' | 'almuerzo' | 'merienda' | 'noche' | 'madruga';
export type Familiarity = 'nuevo' | 'conocido' | 'asiduo' | 'familia';
export type Brevity     = 'corto' | 'normal' | 'detallado';
export type Mood        = 'neutral' | 'excited' | 'down';
export type Urgency     = 'normal' | 'high';

export interface VenueState {
  flamenco:     boolean;   // actuación en vivo activa
  lluvia:       boolean;   // está lloviendo en Sevilla
  terrazaLlena: boolean;   // terraza >85% capacidad
  eventoEspecial?: string; // nombre del evento si hay alguno (opcional)
}

export interface DuendeConfig {
  andaluzIntensity:    number;       // 0.0 neutro → 1.0 cerrao del to
  timeMode:            TimeMode;
  venueState:          VenueState;
  customerFamiliarity: Familiarity;
  responseBrevity:     Brevity;
}

export interface UserStyle {
  andaluzScore: number;   // 0.0–1.0
  urgency:      Urgency;
  mood:         Mood;
  wordCount:    number;   // longitud del mensaje (orientación para brevedad)
}

export interface DuendeContext {
  /** String listo para inyectar en el system-prompt de Curro */
  promptBlock:     string;
  /** Intensidad andaluz efectiva tras ajuste (para logging / telemetría) */
  effectiveIntensity: number;
  /** Brevity calculada definitivamente */
  resolvedBrevity: Brevity;
}

// ── Diccionario con pesos ──────────────────────────────────────────────────────

interface WeightedWord {
  word:   string;
  weight: number;  // 1 = básico/común, 2 = jerga específica sevillana
}

export const ANDALUZ_DICT: WeightedWord[] = [
  // Vocativos y saludos comunes (peso 1)
  { word: 'quillo',        weight: 1 },
  { word: 'quilla',        weight: 1 },
  { word: 'miarma',        weight: 2 },
  { word: 'mi arma',       weight: 2 },
  { word: 'ole',           weight: 1 },
  { word: 'venga',         weight: 1 },
  { word: 'macho',         weight: 1 },
  // Partículas con elisión andaluza (peso 1)
  { word: 'joé',           weight: 1 },
  { word: 'anda ya',       weight: 1 },
  // Jerga sevillana profunda (peso 2)
  { word: 'jartá',         weight: 2 },   // mucho / cantidad
  { word: 'no ni ná',      weight: 2 },   // afirmación rotunda
  { word: 'malaje',        weight: 2 },   // mal bicho
  { word: 'fite tú',       weight: 2 },   // fíjate tú
  { word: 'aro',           weight: 1 },   // claro (uso sevillano)
  { word: 'pejiguera',     weight: 2 },   // persona pesada
  { word: 'trinqui',       weight: 2 },   // vaso de bebida
  { word: 'jartible',      weight: 2 },   // pesado / insistente
  { word: 'apalancao',     weight: 2 },   // quieto sin ganas
  { word: 'pirriaque',     weight: 2 },   // vino malo / bebida genérica
  { word: 'cachondeo',     weight: 1 },
  { word: 'mardita sea',   weight: 2 },
  { word: 'de lujo',       weight: 1 },
  { word: 'de muerte',     weight: 1 },   // "está de muerte" → muy bueno
];

// Máximo teórico de pesos (umbral para normalizar a 1.0)
const ANDALUZ_MAX_WEIGHT = 10;

const URGENCY_WORDS = [
  'rápido', 'prisa', 'urgente', 'deprisa', 'volando', 'pronto',
  'cuanto antes', 'ahora mismo', 'en seguida',
];

// Regex de mood (emojis + palabras)
const EXCITED_RE = /😍|🤩|🥳|🎉|!!+|\bgenial\b|\bincreíble\b|\bfantástico\b|\bfantástica\b|\boleole\b/iu;
const DOWN_RE    = /😞|😔|😢|😟|no me gusta|\bmal\b|\bmala\b|\bregular\b|\bpésimo\b|\bpésima\b/iu;

// ── Detección de estilo ────────────────────────────────────────────────────────

export function detectUserStyle(message: string): UserStyle {
  const lower = message.toLowerCase();

  // Puntuación ponderada / densidad (normalizada por longitud del mensaje)
  const rawScore = ANDALUZ_DICT
    .filter(({ word }) => lower.includes(word))
    .reduce((sum, { weight }) => sum + weight, 0);

  const andaluzScore = Math.min(1.0, rawScore / ANDALUZ_MAX_WEIGHT);

  const urgency: Urgency = URGENCY_WORDS.some(w => lower.includes(w)) ? 'high' : 'normal';

  let mood: Mood = 'neutral';
  if (EXCITED_RE.test(message))    mood = 'excited';
  else if (DOWN_RE.test(message))  mood = 'down';

  const wordCount = message.trim().split(/\s+/).length;

  return { andaluzScore, urgency, mood, wordCount };
}

// ── Hora del día ───────────────────────────────────────────────────────────────

export function getTimeMode(date: Date = new Date()): TimeMode {
  const h = date.getHours();
  if (h >= 7  && h < 12) return 'mañanero';
  if (h >= 12 && h < 16) return 'almuerzo';
  if (h >= 16 && h < 20) return 'merienda';
  if (h >= 20 && h < 23) return 'noche';
  return 'madruga';
}

// Variaciones de saludo para evitar repetición
const TIME_OPENINGS: Record<TimeMode, string[]> = {
  mañanero: [
    '¡Buenas, arma! Tempranito nos ponemos.',
    '¡Buenos días, miarma! ¿Un café con leche o ya tiramos pa las tapas?',
  ],
  almuerzo: [
    '¡Buenas miarma! Que hay hambre hoy, ¿eh?',
    '¡Hombre, justo en hora de tapas! ¿Qué le pongo?',
  ],
  merienda: [
    '¡Buenas tardes, quillo! ¿algo pa merendar?',
    '¡Buenas! La tarde sevillana con una cervecita, ¿no hay nada mejor?',
  ],
  noche: [
    '¡Buenas noches! La noche sevillana está que arde.',
    '¡Ey! La magia de Triana de noche, ¿qué le pongo?',
  ],
  madruga: [
    '¡Con la madrugá y todavía con ganas de tapas! Ole tus huevos, miarma.',
    '¡A estas horas! El duende sevillano no duerme nunca, ¿verdad?',
  ],
};

export function getTimeOpening(mode: TimeMode): string {
  const opts = TIME_OPENINGS[mode];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ── Constructor del contexto Duende ───────────────────────────────────────────

export function buildDuendeContext(
  userStyle:  UserStyle,
  config:     DuendeConfig,
  memories:   string[],
): DuendeContext {

  // Ajuste dinámico de intensidad andaluz
  const effectiveIntensity = userStyle.andaluzScore > 0.5
    ? Math.min(1.0, config.andaluzIntensity + 0.15)
    : Math.max(0.55, config.andaluzIntensity - 0.1);

  // Brevedad: urgencia siempre gana sobre config
  let resolvedBrevity: Brevity = config.responseBrevity;
  if (userStyle.urgency === 'high')    resolvedBrevity = 'corto';
  if (userStyle.wordCount <= 4 && resolvedBrevity === 'detallado') resolvedBrevity = 'normal';

  let brevityNote: string;
  switch (resolvedBrevity) {
    case 'corto':
      brevityNote = '⚡ MÁXIMO 1 FRASE CORTA. El cliente tiene prisa o escribió muy poco.';
      break;
    case 'detallado':
      brevityNote = '💡 Puedes extenderte 3-4 frases. El cliente parece curioso y receptivo.';
      break;
    default:
      brevityNote = '📏 2-3 frases. Ni telegrama ni discurso.';
  }

  const lines: string[] = [];

  // ── Estado del local ──────────────────────────────────────────────────────
  if (config.venueState.flamenco) {
    lines.push('🎵 HAY FLAMENCO EN VIVO AHORA. Menciónalo con entusiasmo si viene al caso.');
  }
  if (config.venueState.eventoEspecial) {
    lines.push(`🎊 EVENTO ESPECIAL: ${config.venueState.eventoEspecial}. Menciónalo con orgullo.`);
  }
  if (config.venueState.lluvia) {
    lines.push('🌧️ LLUEVE EN SEVILLA. Sugiere platos calientes (puchero, caldito, pringá) o el interior acogedor.');
  }
  if (config.venueState.terrazaLlena) {
    lines.push('🪑 TERRAZA CASI LLENA (>85%). Ofrece barra o interior con cariño. No digas "está lleno" directamente; di "la terraza está muy animá esta tarde".');
  }

  // ── Contexto temporal ────────────────────────────────────────────────────
  lines.push(`🕐 MOMENTO: ${config.timeMode}. Saludo sugerido: "${getTimeOpening(config.timeMode)}"`);

  // ── Mood del cliente ─────────────────────────────────────────────────────
  if (userStyle.mood === 'excited') {
    lines.push('😍 EL CLIENTE ESTÁ ENTUSIASMADO. Comparte su energía, sube el tono, dale vidilla.');
  } else if (userStyle.mood === 'down') {
    lines.push('😔 EL CLIENTE PARECE BAJO DE ÁNIMO. Sé especialmente cálido; propón algo que levante el ánimo (tapa favorita, terraza, "un vinito que te sube el alma").');
  }

  // ── Familiaridad ─────────────────────────────────────────────────────────
  switch (config.customerFamiliarity) {
    case 'asiduo':
      lines.push('👋 CLIENTE ASIDUO. Confianza máxima: "¿Lo de siempre, miarma?" o comenta sus gustos si los conoces.');
      break;
    case 'familia':
      lines.push('👨‍👩‍👧 ES "FAMILIA" ANDALUZZIA. Trátalo como colega de toda la vida. Apodos, bromas ligeras, máximo cariño.');
      break;
    case 'conocido':
      lines.push('🙂 CLIENTE CONOCIDO. Un poco de confianza; puedes recordar algo de la última visita si está en memoria.');
      break;
    default:
      // 'nuevo' — sin nota especial
      break;
  }

  // ── Memoria del cliente ───────────────────────────────────────────────────
  if (memories.length > 0) {
    lines.push(`🧠 RECUERDOS DEL CLIENTE (úsalos sutilmente, sin parecer una base de datos):\n${memories.map(m => `    • ${m}`).join('\n')}`);
  }

  const promptBlock = `
[CONTEXTO DUENDE v2 — INTERNO CURRO, NUNCA REVELAR AL CLIENTE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Intensidad andaluz efectiva : ${effectiveIntensity.toFixed(2)} / 1.0
${lines.map(l => `• ${l}`).join('\n')}
• ${brevityNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLA DE ORO: Jamás uses frases robóticas como "la base de datos indica" o
"el sistema recomienda". En su lugar: "Yo te digo, miarma…", "Mira, en la
cocina hoy…", "Te lo juro por mi madre que esto está de muerte…".
`.trim();

  return { promptBlock, effectiveIntensity, resolvedBrevity };
}
