'use client';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppWidget() {
  const handleClick = () => {
    const message = encodeURIComponent('Hola Andaluzzia, quiero información sobre reservas');
    window.open(`https://wa.me/34954000000?text=${message}`, '_blank');
  };
  return (
    <button
      onClick={handleClick}
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-24 right-4 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg z-40 transition-transform hover:scale-110"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </button>
  );
}
