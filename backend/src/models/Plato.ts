import mongoose, { Schema, Document } from 'mongoose';

interface IPlato extends Document {
  nombre:          string;
  descripcion:     string;
  precio:          number;
  categoria:       'tapas' | 'raciones' | 'postres' | 'bebidas' | 'especiales';
  imagen:          string;
  disponible:      boolean;
  alergenos?:      string[];
  esRecomendado:   boolean;   // aparece en "lo más pedido"
  esPlatoDia:      boolean;   // plato del día (solo 1 activo)
  esLoMasRico:     boolean;   // selección especial del maitre
  maridaje?:       string;    // sugerencia de bebida (ej: "Cruzcampo bien tirada")
  origen?:         string;    // tradición / barrio / historia del plato
  orden:           number;    // orden de aparición en el menú
  createdAt:       Date;
  updatedAt:       Date;
}

const PlatoSchema = new Schema<IPlato>({
  nombre:        { type: String,  required: true, trim: true },
  descripcion:   { type: String,  required: true },
  precio:        { type: Number,  required: true },
  categoria:     { type: String,  required: true, enum: ['tapas', 'raciones', 'postres', 'bebidas', 'especiales'] },
  imagen:        { type: String,  default: '' },
  disponible:    { type: Boolean, default: true },
  alergenos:     [String],
  esRecomendado: { type: Boolean, default: false },
  esPlatoDia:    { type: Boolean, default: false },
  esLoMasRico:   { type: Boolean, default: false },
  maridaje:      String,
  origen:        String,
  orden:         { type: Number,  default: 99 },
}, { timestamps: true });

export const Plato = mongoose.model<IPlato>('Plato', PlatoSchema);
