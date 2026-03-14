'use client';

import { useChat } from 'ai/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MaitreChatProps { menuContext: any[]; }

export default function MaitreChat({ menuContext }: MaitreChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api:  '/api/chat',
    body: { menuContext },
    initialMessages: [{
      id:      'welcome',
      role:    'assistant',
      content: '¡Bienvenío a Andaluzzia! Soy El Curro, su maitre virtual. ¿En qué puedo ayudarle hoy? ¿Quiere que le recomiende algo de nuestro menú o prefiere reservar mesa?',
    }],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-16 h-16 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
        >
          <span className="text-3xl">🤵</span>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-amber-600 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤵</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">El Curro</h3>
                  <p className="text-amber-100 text-sm">Tu maitre virtual</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-amber-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-amber-50 space-y-4 min-h-[300px]">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-amber-600' : 'bg-blue-600'}`}>
                      {message.role === 'user'
                        ? <User className="w-4 h-4 text-white" />
                        : <Bot  className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${message.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-md rounded-tl-none border border-amber-200'}`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-md border border-amber-200">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-amber-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-full focus:outline-none focus:border-amber-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-12 h-12 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 rounded-full flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
