import mongoose, { Schema, Document } from 'mongoose';

interface IPlato extends Document {
  nombre:      string;
  descripcion: string;
  precio:      number;
  categoria:   'tapas' | 'raciones' | 'postres' | 'bebidas';
  imagen:      string;
  disponible:  boolean;
  alergenos?:  string[];
  createdAt:   Date;
  updatedAt:   Date;
}

const PlatoSchema = new Schema<IPlato>({
  nombre:      { type: String, required: true, trim: true },
  descripcion: { type: String, required: true },
  precio:      { type: Number, required: true },
  categoria:   { type: String, required: true, enum: ['tapas', 'raciones', 'postres', 'bebidas'] },
  imagen:      { type: String, required: true },
  disponible:  { type: Boolean, default: true },
  alergenos:   [String],
}, { timestamps: true });

export const Plato = mongoose.model<IPlato>('Plato', PlatoSchema);
