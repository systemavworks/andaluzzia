import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export const getPlatos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoria, disponible } = req.query;
    let query = supabase.from('tapas').select('*').order('orden').order('nombre');
    if (categoria)              query = query.eq('categoria',  categoria as string);
    if (disponible !== undefined) query = query.eq('disponible', disponible === 'true');
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('Error obteniendo carta', { error: err });
    res.status(500).json({ error: 'Error obteniendo el menú' });
  }
};

export const getPlatoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase.from('tapas').select('*').eq('id', req.params.id).single();
    if (error || !data) { res.status(404).json({ error: 'Plato no encontrado' }); return; }
    res.json(data);
  } catch (err) {
    logger.error('Error obteniendo plato', { error: err });
    res.status(500).json({ error: 'Error obteniendo el plato' });
  }
};

export const createPlato = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, precio, categoria, alergenos, maridaje, origen } = req.body;
    const foto_url = req.file?.path ?? null;
    const { data, error } = await supabase.from('tapas').insert({
      nombre, descripcion, precio, categoria, foto_url, maridaje, origen,
      alergenos: alergenos ? JSON.parse(alergenos) : [],
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    logger.error('Error creando plato', { error: err });
    res.status(500).json({ error: 'Error creando el plato' });
  }
};

export const updatePlato = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates: Record<string, unknown> = { ...req.body };
    if (req.file) updates.foto_url = req.file.path;
    const { data, error } = await supabase
      .from('tapas').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) { res.status(404).json({ error: 'Plato no encontrado' }); return; }
    res.json(data);
  } catch (err) {
    logger.error('Error actualizando plato', { error: err });
    res.status(500).json({ error: 'Error actualizando el plato' });
  }
};

export const deletePlato = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase.from('tapas').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Plato eliminado correctamente' });
  } catch (err) {
    logger.error('Error eliminando plato', { error: err });
    res.status(500).json({ error: 'Error eliminando el plato' });
  }
};
