'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Plato {
  _id:           string;
  nombre:        string;
  descripcion:   string;
  precio:        number;
  categoria:     string;
  imagen:        string;
  disponible:    boolean;
  alergenos?:    string[];
  esRecomendado?: boolean;
  esPlatoDia?:    boolean;
  esLoMasRico?:   boolean;
  maridaje?:      string;
}

export default function MenuCard({ plato }: { plato: Plato }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
        plato.disponible ? 'border-amber-200' : 'border-gray-300 opacity-60'
      }`}
    >
      <div className="relative h-48 bg-gray-100">
        {plato.imagen ? (
          <Image
            src={plato.imagen}
            alt={plato.nombre}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}

        {/* Badges de estado */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {plato.esPlatoDia && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">🌟 Plato del día</span>
          )}
          {plato.esLoMasRico && (
            <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">🤓 El Curro lo pide</span>
          )}
          {plato.esRecomendado && !plato.esLoMasRico && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">❤️ Muy pedido</span>
          )}
        </div>

        {!plato.disponible && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded">No disponible</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-amber-800">{plato.nombre}</h3>
          <span className="text-lg font-semibold text-amber-600 ml-2 flex-shrink-0">{plato.precio}€</span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{plato.descripcion}</p>
        {plato.maridaje && (
          <p className="text-amber-500 text-xs mb-2">🍺 {plato.maridaje}</p>
        )}
        {plato.alergenos && plato.alergenos.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {plato.alergenos.map((a, i) => (
              <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">{a}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
