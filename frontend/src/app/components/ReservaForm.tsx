'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import axios from 'axios';

interface ReservaFormData {
  nombre:   string;
  email:    string;
  telefono: string;
  personas: number;
  fecha:    string;
  hora:     string;
  notas?:   string;
}

export default function ReservaForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReservaFormData>();

  // Fecha mínima: mañana (no se reserva a última hora para hoy)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const onSubmit = async (data: ReservaFormData) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reservas`, data);
      if (response.status === 201) {
        setSuccess(true);
        reset();
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch {
      setError('Error al crear la reserva. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
    >
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ¡Reserva creada con éxito! Te enviaremos confirmación por WhatsApp.
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-amber-800 font-semibold mb-2">Nombre *</label>
          <input {...register('nombre', { required: 'Nombre requerido' })}
            className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600"
            placeholder="Tu nombre" />
          {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="block text-amber-800 font-semibold mb-2">Email *</label>
          <input {...register('email', { required: 'Email requerido', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })}
            className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600"
            placeholder="tu@email.com" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-amber-800 font-semibold mb-2">Teléfono *</label>
          <input {...register('telefono', {
            required: 'Teléfono requerido',
            pattern: { value: /^[6789]\d{8}$/, message: 'Teléfono español sin espacios (ej. 600123456)' },
          })}
            className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600"
            placeholder="600 000 000" />
          {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
        </div>
        <div>
          <label className="block text-amber-800 font-semibold mb-2">Personas *</label>
          <select {...register('personas', { required: 'Número requerido' })}
            className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
            ))}
          </select>
          {errors.personas && <p className="text-red-500 text-sm mt-1">{errors.personas.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-amber-800 font-semibold mb-2">Fecha *</label>
          <input type="date" {...register('fecha', {
            required: 'Fecha requerida',
            min: { value: minDate, message: 'La fecha debe ser a partir de mañana' },
            validate: v => {
              const day = new Date(v).getUTCDay();
              return day !== 1 || 'Los lunes estamos cerrados';
            },
          })}
            className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600" />
          {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>}
        </div>
        <div>
          <label className="block text-amber-800 font-semibold mb-2">Hora *</label>
          <select {...register('hora', { required: 'Hora requerida' })}
            className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600">
            {['12:00','13:00','14:00','15:00','20:00','21:00','22:00','23:00'].map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          {errors.hora && <p className="text-red-500 text-sm mt-1">{errors.hora.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-amber-800 font-semibold mb-2">Notas (opcional)</label>
        <textarea {...register('notas')}
          className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600"
          rows={3} placeholder="Alergias, ocasión especial, etc." />
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Reservar Mesa'}
      </button>
    </motion.form>
  );
}
