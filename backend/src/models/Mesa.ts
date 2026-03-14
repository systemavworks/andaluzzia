import mongoose, { Schema, Document } from 'mongoose';

export interface IMesa extends Document {
  numero:    number;
  zona:      'interior' | 'terraza' | 'barra' | 'privado';
  capacidad: number;
  activa:    boolean;
  notas?:    string;
}

const MesaSchema = new Schema<IMesa>({
  numero:    { type: Number, required: true, unique: true },
  zona:      { type: String, required: true, enum: ['interior', 'terraza', 'barra', 'privado'] },
  capacidad: { type: Number, required: true, min: 1, max: 20 },
  activa:    { type: Boolean, default: true },
  notas:     String,
}, { timestamps: true });

export const Mesa = mongoose.model<IMesa>('Mesa', MesaSchema);
