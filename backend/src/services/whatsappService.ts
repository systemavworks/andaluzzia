import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const enviarConfirmacionWhatsApp = async (reserva: any): Promise<void> => {
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
      to:   `whatsapp:+34${reserva.telefono.replace(/\s/g, '')}`,
    });
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
  }
};
