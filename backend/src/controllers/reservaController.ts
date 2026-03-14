import { Request, Response } from 'express';
import { Reserva } from '../models/Reserva';
import { enviarEmailConfirmacion } from '../services/emailService';
import { enviarConfirmacionWhatsApp } from '../services/whatsappService';

export const crearReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const reserva = new Reserva(req.body);
    await reserva.save();
    await enviarEmailConfirmacion(reserva);
    await enviarConfirmacionWhatsApp(reserva);
    res.status(201).json({ message: 'Reserva creada correctamente', reserva });
  } catch {
    res.status(500).json({ error: 'Error creando la reserva' });
  }
};

export const getReservas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha, estado } = req.query;
    const filtro: any = {};
    if (fecha)  filtro.fecha  = new Date(fecha as string);
    if (estado) filtro.estado = estado;
    const reservas = await Reserva.find(filtro).sort({ fecha: 1, hora: 1 });
    res.json(reservas);
  } catch {
    res.status(500).json({ error: 'Error obteniendo reservas' });
  }
};

export const actualizarEstadoReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado } = req.body;
    const reserva = await Reserva.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!reserva) { res.status(404).json({ error: 'Reserva no encontrada' }); return; }
    res.json(reserva);
  } catch {
    res.status(500).json({ error: 'Error actualizando reserva' });
  }
};
