import mongoose, { Schema, Document } from 'mongoose';

export interface IHorarioEspecial extends Document {
  fecha:       Date;
  descripcion: string;                 // "Cerrado por Semana Santa"
  tipo:        'cierre' | 'horario_reducido' | 'evento';
  horaApertura?: string;               // "14:00" si tipo !== cierre
  horaCierre?:   string;               // "20:00"
  activo:      boolean;
}

const HorarioEspecialSchema = new Schema<IHorarioEspecial>({
  fecha:         { type: Date,    required: true, unique: true },
  descripcion:   { type: String,  required: true },
  tipo:          { type: String,  required: true, enum: ['cierre', 'horario_reducido', 'evento'] },
  horaApertura:  String,
  horaCierre:    String,
  activo:        { type: Boolean, default: true },
}, { timestamps: true });

export const HorarioEspecial = mongoose.model<IHorarioEspecial>('HorarioEspecial', HorarioEspecialSchema);
