/**
 * notifications.service.ts — Notificaciones de Reserva v2
 *
 * Unifica WhatsApp (Twilio) y Email (Nodemailer) en un solo módulo.
 * Ambos canales son opcionales: si faltan las variables de entorno,
 * se loguea un aviso y se continúa sin error.
 *
 * Mejoras v2:
 *  - Tipo explícito ReservaNotificacion (evita `any`).
 *  - Normalización de teléfono robusta (E.164).
 *  - Template HTML del email responsive y con branding Andaluzzia.
 *  - sendAllNotifications() lanza WhatsApp + Email en paralelo.
 *  - Retry simple (1 intento) para WhatsApp con backoff 2 s.
 *  - Exportación de helpers para tests.
 */

import nodemailer from 'nodemailer';
import twilio     from 'twilio';
import { logger } from '../utils/logger';

// ── Tipo público ───────────────────────────────────────────────────────────────

export interface ReservaNotificacion {
  nombre:    string;
  email?:    string;
  telefono:  string;
  fecha:     string | Date;
  hora:      string;
  personas:  number | string;
  zona?:     string;
  notas?:    string;
  reservaId: string | number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Normaliza a E.164 con prefijo +34 si falta el código de país */
export function normalizePhone(raw: string): string {
  const stripped = raw.replace(/[\s\-().]/g, '');
  if (stripped.startsWith('+')) return stripped;
  if (stripped.startsWith('00')) return `+${stripped.slice(2)}`;
  return `+34${stripped}`;  // default España
}

export function formatDate(dateInput: string | Date): string {
  return new Date(dateInput).toLocaleDateString('es-ES', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

// ── WhatsApp (Twilio) ──────────────────────────────────────────────────────────

function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function buildWhatsAppBody(r: ReservaNotificacion): string {
  const lines = [
    `🍽️ *Andaluzzia* — Reserva Confirmada ✅`,
    ``,
    `👤 *Nombre:*   ${r.nombre}`,
    `📅 *Fecha:*    ${formatDate(r.fecha)}`,
    `⏰ *Hora:*     ${r.hora}`,
    `👥 *Personas:* ${r.personas}`,
  ];
  if (r.zona)  lines.push(`🪑 *Zona:*     ${r.zona}`);
  if (r.notas) lines.push(`📝 *Nota:*     ${r.notas}`);
  lines.push(
    ``,
    `📍 Calle Betis, 45 — Triana, Sevilla`,
    ``,
    `¡Nos vemos pronto, arma! 🇪🇸🌊`,
    `Si necesitas algo: hola@andaluzzia.es`,
  );
  return lines.join('\n');
}

async function sendWhatsApp(reserva: ReservaNotificacion, attempt = 1): Promise<void> {
  const client = getTwilioClient();
  const from   = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!client || !from) {
    logger.warn('WhatsApp no configurado (TWILIO_* ausentes) — omitiendo notificación WA', { reservaId: reserva.reservaId });
    return;
  }

  try {
    const to = `whatsapp:${normalizePhone(reserva.telefono)}`;
    await client.messages.create({ body: buildWhatsAppBody(reserva), from, to });
    logger.info('WhatsApp enviado', { reservaId: reserva.reservaId, to });
  } catch (err) {
    logger.error('Error enviando WhatsApp', { error: err, reservaId: reserva.reservaId, attempt });
    if (attempt === 1) {
      // Un reintento tras 2 s
      await new Promise(r => setTimeout(r, 2_000));
      return sendWhatsApp(reserva, 2);
    }
  }
}

// ── Email (Nodemailer) ─────────────────────────────────────────────────────────

function getTransporter() {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host:   EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT ?? '587'),
    secure: (process.env.EMAIL_PORT === '465'),
    auth:   { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

function buildEmailHtml(r: ReservaNotificacion): string {
  const zonaRow = r.zona
    ? `<tr><td style="padding:6px 0;color:#78716C;font-size:14px;">🪑 Zona</td><td style="padding:6px 0;font-weight:600;font-size:14px;">${r.zona}</td></tr>`
    : '';
  const notasRow = r.notas
    ? `<tr><td colspan="2" style="padding:12px;background:#FEF3C7;border-radius:8px;font-size:13px;color:#78716C;">📝 ${r.notas}</td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reserva Confirmada — Andaluzzia</title>
</head>
<body style="margin:0;padding:0;background:#FEF3C7;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF3C7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4E1809,#7C2D12);padding:36px 32px;text-align:center;">
              <div style="font-family:'Georgia',serif;font-size:28px;color:#F59E0B;margin-bottom:4px;">🍺 Andaluzzia</div>
              <div style="color:rgba(255,255,255,.7);font-size:13px;letter-spacing:.1em;text-transform:uppercase;">Triana · Sevilla · Desde 1985</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="font-family:'Georgia',serif;font-size:24px;color:#1A0A00;margin:0 0 8px;">✅ ¡Reserva Confirmada!</h1>
              <p style="color:#78716C;font-size:15px;margin:0 0 28px;line-height:1.6;">Hola <strong>${r.nombre}</strong>, tu reserva está lista. Te esperamos con las tapas puestas 🎉</p>

              <!-- Datos -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #FDE68A;border-radius:12px;padding:20px;background:#FFFBF5;">
                <tr>
                  <td style="padding:6px 0;color:#78716C;font-size:14px;">📅 Fecha</td>
                  <td style="padding:6px 0;font-weight:600;font-size:14px;">${formatDate(r.fecha)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78716C;font-size:14px;">⏰ Hora</td>
                  <td style="padding:6px 0;font-weight:600;font-size:14px;">${r.hora}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78716C;font-size:14px;">👥 Personas</td>
                  <td style="padding:6px 0;font-weight:600;font-size:14px;">${r.personas}</td>
                </tr>
                ${zonaRow}
                ${notasRow}
              </table>

              <!-- Dirección -->
              <div style="margin-top:24px;padding:16px;background:#FEF3C7;border-radius:10px;text-align:center;">
                <div style="font-size:14px;color:#78716C;">📍 Calle Betis, 45 — Triana, Sevilla 41010</div>
                <a href="https://maps.google.com/?q=Calle+Betis+45+Triana+Sevilla"
                   style="display:inline-block;margin-top:10px;padding:8px 20px;background:#7C2D12;color:#fff;border-radius:999px;font-size:13px;text-decoration:none;">
                  Ver en Google Maps →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1A0A00;padding:20px 32px;text-align:center;">
              <p style="color:rgba(255,255,255,.5);font-size:12px;margin:0;">
                ¿Necesitas cambiar la reserva? Escríbenos a
                <a href="mailto:hola@andaluzzia.es" style="color:#F59E0B;">hola@andaluzzia.es</a>
                · © ${new Date().getFullYear()} Andaluzzia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(reserva: ReservaNotificacion): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn('Email no configurado (EMAIL_* ausentes) — omitiendo notificación email', { reservaId: reserva.reservaId });
    return;
  }
  if (!reserva.email) {
    logger.debug('Reserva sin email — omitiendo notificación email', { reservaId: reserva.reservaId });
    return;
  }

  try {
    await transporter.sendMail({
      from:    `"Andaluzzia 🍺" <${process.env.EMAIL_USER}>`,
      to:      reserva.email,
      subject: `✅ Reserva Confirmada — Andaluzzia (${formatDate(reserva.fecha)})`,
      html:    buildEmailHtml(reserva),
    });
    logger.info('Email enviado', { reservaId: reserva.reservaId, to: reserva.email });
  } catch (err) {
    logger.error('Error enviando email de confirmación', { error: err, reservaId: reserva.reservaId });
  }
}

// ── API pública ────────────────────────────────────────────────────────────────

/**
 * Envía WhatsApp + Email en paralelo.
 * Nunca lanza excepción: los fallos se loguean y se continúa.
 */
export async function sendAllNotifications(reserva: ReservaNotificacion): Promise<void> {
  await Promise.allSettled([
    sendWhatsApp(reserva),
    sendEmail(reserva),
  ]);
}

export { sendWhatsApp, sendEmail };
