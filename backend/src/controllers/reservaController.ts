import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { enviarEmailConfirmacion } from '../services/emailService';
import { enviarConfirmacionWhatsApp } from '../services/whatsappService';
import { logger } from '../utils/logger';

const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'cancelada', 'completada'] as const;

export const crearReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, telefono, personas, fecha, hora, notas, zona } = req.body;
    const { data: reserva, error } = await supabase.from('reservas').insert({
      nombre_cliente: nombre,
      email, telefono, personas,
      fecha, hora,
      notas: notas?.slice(0, 200),
      zona,
    }).select().single();
    if (error) throw error;

    // Guardar/actualizar cliente para memoria de fidelidad
    supabase.from('clientes')
      .upsert(
        { telefono, nombre, email, ultima_visita: new Date().toISOString().split('T')[0] },
        { onConflict: 'telefono' }
      )
      .then(() => {})
      .catch(e => logger.warn('Error upserting cliente', { error: e }));

    // Notificaciones no-bloqueantes: un fallo no cancela la reserva
    const reservaNotif = { ...reserva, nombre: reserva.nombre_cliente };
    Promise.all([
      enviarEmailConfirmacion(reservaNotif),
      enviarConfirmacionWhatsApp(reservaNotif),
    ]).catch(err => logger.error('Error notificaciones reserva', { error: err, reservaId: reserva.id }));

    res.status(201).json({ message: 'Reserva creada correctamente', reserva });
  } catch (err) {
    logger.error('Error creando reserva', { error: err });
    res.status(500).json({ error: 'Error creando la reserva' });
  }
};

export const getReservas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha, estado } = req.query;
    let query = supabase.from('reservas').select('*').order('fecha').order('hora');
    if (fecha)  query = query.eq('fecha', fecha as string);
    if (estado && ESTADOS_VALIDOS.includes(estado as typeof ESTADOS_VALIDOS[number])) {
      query = query.eq('estado', estado as string);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
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
    const { data, error } = await supabase
      .from('reservas')
      .update({ estado, confirmada: estado === 'confirmada' })
      .eq('id', req.params.id)
      .select().single();
    if (error || !data) { res.status(404).json({ error: 'Reserva no encontrada' }); return; }
    res.json(data);
  } catch (err) {
    logger.error('Error actualizando reserva', { error: err });
    res.status(500).json({ error: 'Error actualizando reserva' });
  }
};
