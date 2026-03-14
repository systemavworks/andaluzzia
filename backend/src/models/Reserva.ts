import mongoose, { Schema, Document } from 'mongoose';

interface IReserva extends Document {
  nombre:    string;
  email:     string;
  telefono:  string;
  personas:  number;
  fecha:     Date;
  hora:      string;
  notas?:    string;
  estado:    'pendiente' | 'confirmada' | 'cancelada';
  createdAt: Date;
}

const ReservaSchema = new Schema<IReserva>({
  nombre:   { type: String, required: true },
  email:    { type: String, required: true },
  telefono: { type: String, required: true },
  personas: { type: Number, required: true, min: 1, max: 20 },
  fecha:    { type: Date,   required: true },
  hora:     { type: String, required: true },
  notas:    String,
  estado:   { type: String, default: 'pendiente', enum: ['pendiente', 'confirmada', 'cancelada'] },
}, { timestamps: true });

export const Reserva = mongoose.model<IReserva>('Reserva', ReservaSchema);
