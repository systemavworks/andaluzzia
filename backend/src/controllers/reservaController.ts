import { Request, Response } from 'express';
import { Reserva } from '../models/Reserva';
import { enviarEmailConfirmacion } from '../services/emailService';
import { enviarConfirmacionWhatsApp } from '../services/whatsappService';
import { logger } from '../utils/logger';

const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'cancelada', 'completada'] as const;

export const crearReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const reserva = new Reserva(req.body);
    await reserva.save();

    // Notificaciones en paralelo y no-bloqueantes: un fallo no cancela la reserva
    Promise.all([
      enviarEmailConfirmacion(reserva),
      enviarConfirmacionWhatsApp(reserva),
    ]).catch(err => logger.error('Error enviando notificaciones de reserva', { error: err, reservaId: reserva._id }));

    res.status(201).json({ message: 'Reserva creada correctamente', reserva });
  } catch (err) {
    logger.error('Error creando reserva', { error: err });
    res.status(500).json({ error: 'Error creando la reserva' });
  }
};

export const getReservas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha, estado } = req.query;
    const filtro: Record<string, unknown> = {};
    if (fecha)  filtro.fecha  = new Date(fecha as string);
    if (estado && ESTADOS_VALIDOS.includes(estado as typeof ESTADOS_VALIDOS[number])) {
      filtro.estado = estado;
    }
    const reservas = await Reserva.find(filtro).sort({ fecha: 1, hora: 1 });
    res.json(reservas);
  } catch (err) {
    logger.error('Error obteniendo reservas', { error: err });
    res.status(500).json({ error: 'Error obteniendo reservas' });
  }
};

export const actualizarEstadoReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado)) {
      res.status(400).json({ error: 'Estado no válido' });
      return;
    }
    const reserva = await Reserva.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!reserva) { res.status(404).json({ error: 'Reserva no encontrada' }); return; }
    res.json(reserva);
  } catch (err) {
    logger.error('Error actualizando estado de reserva', { error: err });
    res.status(500).json({ error: 'Error actualizando reserva' });
  }
};
