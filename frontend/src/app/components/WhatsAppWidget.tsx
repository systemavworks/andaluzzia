'use client';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppWidget() {
  const phone   = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '34954000000';
  const message = encodeURIComponent('Hola Andaluzzia, quiero información sobre reservas');

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-24 right-4 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg z-40 transition-transform hover:scale-110"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}
