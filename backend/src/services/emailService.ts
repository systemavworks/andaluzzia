import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const enviarEmailConfirmacion = async (reserva: any): Promise<void> => {
  await transporter.sendMail({
    from:    `"Andaluzzia" <${process.env.EMAIL_USER}>`,
    to:      reserva.email,
    subject: '✅ Reserva Confirmada — Andaluzzia',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#d97706;">¡Reserva Confirmada! 🍽️</h1>
        <p>Hola ${reserva.nombre},</p>
        <p>Tu reserva en <strong>Andaluzzia</strong> ha sido confirmada:</p>
        <ul>
          <li>📅 Fecha:   ${new Date(reserva.fecha).toLocaleDateString('es-ES')}</li>
          <li>⏰ Hora:    ${reserva.hora}</li>
          <li>👥 Personas: ${reserva.personas}</li>
        </ul>
        <p>📍 Calle Betis, 45 — Triana, Sevilla</p>
        <p>¡Nos vemos pronto!</p>
      </div>`,
  });
};
