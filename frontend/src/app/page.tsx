'use client';
import { useEffect, useState } from 'react';
import MaitreChat     from './components/MaitreChat';
import WhatsAppWidget from './components/WhatsAppWidget';
import MenuCard       from './components/MenuCard';
import ReservaForm    from './components/ReservaForm';
import { motion } from 'framer-motion';

export default function Home() {
  const [menu,    setMenu]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/menu`)
      .then(res  => res.json())
      .then(data => { setMenu(data); setLoading(false); })
      .catch(err => { console.error('Error loading menu:', err); setLoading(false); });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/sevilla-bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 azulejo-pattern opacity-10" />
        <div className="relative z-10 text-center px-4">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-serif font-bold text-amber-800 mb-6">
            Andaluzzia
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl text-amber-700 mb-8">
            Sabor auténtico sevillano desde 1985
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-4 justify-center">
            <a href="#menu"     className="px-8 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors font-semibold">Ver Menú</a>
            <a href="#reservas" className="px-8 py-3 border-2 border-amber-600 text-amber-600 rounded-full hover:bg-amber-600 hover:text-white transition-colors font-semibold">Reservar Mesa</a>
          </motion.div>
        </div>
      </section>

      {/* Menú */}
      <section id="menu" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-serif font-bold text-center text-amber-800 mb-12">Nuestras Tapas</h2>
        {loading ? (
          <div className="text-center text-amber-600">Cargando menú...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menu.map((plato: any) => <MenuCard key={plato._id} plato={plato} />)}
          </div>
        )}
      </section>

      {/* Reservas */}
      <section id="reservas" className="py-20 px-4 bg-amber-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center text-amber-800 mb-12">Reserva tu Mesa</h2>
          <ReservaForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <p className="text-amber-200">📍 Calle Betis, 45 — Triana, Sevilla</p>
          <p className="text-amber-200">📞 954 00 00 00</p>
          <p className="text-amber-200">🍺 Cruzcampo disponible</p>
          <p className="text-amber-200">⏰ Martes a Domingo 12:00-00:00 · Lunes cerrado</p>
        </div>
      </footer>

      <MaitreChat menuContext={menu} />
      <WhatsAppWidget />
    </main>
  );
}
