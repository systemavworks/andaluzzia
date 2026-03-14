import { Request, Response } from 'express';
import { Plato } from '../models/Plato';

export const getPlatos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoria, disponible } = req.query;
    const filtro: any = {};
    if (categoria)           filtro.categoria  = categoria;
    if (disponible !== undefined) filtro.disponible = disponible === 'true';
    const platos = await Plato.find(filtro).sort({ orden: 1, categoria: 1, nombre: 1 });
    res.json(platos);
  } catch {
    res.status(500).json({ error: 'Error obteniendo el menú' });
  }
};

export const getPlatoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const plato = await Plato.findById(req.params.id);
    if (!plato) { res.status(404).json({ error: 'Plato no encontrado' }); return; }
    res.json(plato);
  } catch {
    res.status(500).json({ error: 'Error obteniendo el plato' });
  }
};

export const createPlato = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, precio, categoria, alergenos } = req.body;
    const imagen = req.file?.path || '';
    const plato = new Plato({
      nombre, descripcion, precio, categoria, imagen,
      alergenos: alergenos ? JSON.parse(alergenos) : [],
    });
    await plato.save();
    res.status(201).json(plato);
  } catch {
    res.status(500).json({ error: 'Error creando el plato' });
  }
};

export const updatePlato = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.imagen = req.file.path;
    const plato = await Plato.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!plato) { res.status(404).json({ error: 'Plato no encontrado' }); return; }
    res.json(plato);
  } catch {
    res.status(500).json({ error: 'Error actualizando el plato' });
  }
};

export const deletePlato = async (req: Request, res: Response): Promise<void> => {
  try {
    const plato = await Plato.findByIdAndDelete(req.params.id);
    if (!plato) { res.status(404).json({ error: 'Plato no encontrado' }); return; }
    res.json({ message: 'Plato eliminado correctamente' });
  } catch {
    res.status(500).json({ error: 'Error eliminando el plato' });
  }
};
