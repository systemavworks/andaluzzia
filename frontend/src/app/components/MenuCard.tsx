'use client';
import { Image } from 'cloudinary-react';
import { motion } from 'framer-motion';

interface Plato {
  _id:         string;
  nombre:      string;
  descripcion: string;
  precio:      number;
  categoria:   string;
  imagen:      string;
  disponible:  boolean;
  alergenos?:  string[];
}

export default function MenuCard({ plato }: { plato: Plato }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${plato.disponible ? 'border-amber-200' : 'border-gray-300 opacity-60'}`}
    >
      <div className="relative h-48 bg-gray-100">
        {plato.imagen ? (
          <Image
            cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
            publicId={plato.imagen}
            alt={plato.nombre}
            className="w-full h-full object-cover"
            width="400" height="300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        {!plato.disponible && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded">No disponible</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-amber-800">{plato.nombre}</h3>
          <span className="text-lg font-semibold text-amber-600">{plato.precio}€</span>
        </div>
        <p className="text-gray-600 text-sm mb-3">{plato.descripcion}</p>
        {plato.alergenos && plato.alergenos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {plato.alergenos.map((a, i) => (
              <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">{a}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
