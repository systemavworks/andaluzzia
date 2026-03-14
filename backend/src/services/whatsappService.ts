import twilio from 'twilio';
import { logger } from '../utils/logger';

const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

export const enviarConfirmacionWhatsApp = async (reserva: any): Promise<void> => {
  const client = getClient();
  if (!client || !process.env.TWILIO_WHATSAPP_NUMBER) {
    logger.warn('WhatsApp no configurado (TWILIO_* ausentes) — reserva no notificada por WhatsApp');
    return;
  }

  // Normalizar teléfono: quitar espacios/guiones y añadir prefijo +34 si falta
  const telefono = reserva.telefono.replace(/[\s\-().]/g, '');
  const toNumber = telefono.startsWith('+') ? telefono : `+34${telefono}`;

  try {
    await client.messages.create({
      body: [
        `🍽️ *Andaluzzia* — Reserva Confirmada`,
        ``,
        `👤 Nombre:   ${reserva.nombre}`,
        `📅 Fecha:    ${new Date(reserva.fecha).toLocaleDateString('es-ES')}`,
        `⏰ Hora:     ${reserva.hora}`,
        `👥 Personas: ${reserva.personas}`,
        ``,
        `📍 Calle Betis, 45 — Triana, Sevilla`,
        `¡Nos vemos pronto, arma! 🇪🇸`,
      ].join('\n'),
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to:   `whatsapp:${toNumber}`,
    });
  } catch (error) {
    logger.error('Error enviando WhatsApp de confirmación', { error, reservaId: reserva._id });
  }
};
