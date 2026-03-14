'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, AlertCircle, Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  id:   string;
  role: 'user' | 'assistant';
  content: string;
}

const MAX_MESSAGES   = 20;    // espejo del límite del backend
const MAX_MSG_CHARS  = 400;   // caracteres máx por mensaje del usuario

const WELCOME_MSG: Message = {
  id:      'welcome',
  role:    'assistant',
  content: '¡Bienvenío a Andaluzzia! Soy El Curro, su maitre virtual. ¿En qué puedo ayudarle hoy? ¿Quiere que le recomiende algo de nuestro menú o prefiere reservar mesa?',
};

export default function MaitreChat() {
  const [isOpen,       setIsOpen]       = useState(false);
  const [messages,     setMessages]     = useState<Message[]>([WELCOME_MSG]);
  const [input,        setInput]        = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [error,        setError]        = useState('');
  const [sessionId,    setSessionId]    = useState<string>('');

  // ── Cámara ─────────────────────────────────────────────────────────────
  const [isCameraOpen,   setIsCameraOpen]   = useState(false);
  const [isIdentifying,  setIsIdentifying]  = useState(false);
  const [cameraError,    setCameraError]    = useState('');
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim().slice(0, MAX_MSG_CHARS);
    if (!text || isLoading || limitReached) return;

    setError('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages:  newMessages.slice(-MAX_MESSAGES).map(({ role, content }) => ({ role, content })),
          sessionId: sessionId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Persistir el sessionId que devuelve el backend
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);

      const assistantMsg: Message = {
        id:      (Date.now() + 1).toString(),
        role:    'assistant',
        content: data.content || 'Déjame consultarlo con la cocina, arma...',
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (data.limitReached) setLimitReached(true);
    } catch {
      setError('El Curro está en la cocina un momento. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, limitReached, messages, sessionId]);

  // ── Cámara: abrir ───────────────────────────────────────────────────────
  const openCamera = useCallback(async () => {
    setCameraError('');
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('No se ha podido acceder a la cámara. Comprueba los permisos del navegador.');
    }
  }, []);

  // ── Cámara: cerrar ──────────────────────────────────────────────────────
  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
    setCameraError('');
  }, []);

  // Limpiar stream al desmontar
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  // ── Cámara: capturar y enviar ───────────────────────────────────────────
  const captureAndIdentify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isIdentifying) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.75);
    closeCamera();
    setIsIdentifying(true);

    // Mensaje de espera en el chat
    const thinkingMsg: Message = {
      id:      `cam_${Date.now()}`,
      role:    'assistant',
      content: '📸 Déjame ver esa tapa un momentito, miarma…',
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const res = await fetch('/api/curro/identify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: base64, sessionId: sessionId || undefined }),
      });

      const data = await res.json();
      let reply: string;

      if (data.fallback) {
        reply = data.suggestion || '¡No he podío pillarlo clarito! ¿Me dices tú qué tapa es?';
      } else if (data.sin_match) {
        reply = `Eso parece *${data.nombre_detectado}* pero no lo tengo en la carta. ${data.suggestion}`;
      } else {
        const vino = data.vino ? ` Marida de lujo con ${data.vino.nombre} (${data.vino.tipo}).` : '';
        const maridaje = data.maridaje ? ` ${data.maridaje}.` : '';
        reply = `¡Ole miarma! Eso es **${data.nombre}** — ${data.precio}€. ${data.descripcion}.${maridaje}${vino} ¿Te lo pongo?`;
      }

      setMessages(prev => [
        ...prev.filter(m => m.id !== thinkingMsg.id),
        { id: `cam_resp_${Date.now()}`, role: 'assistant', content: reply },
      ]);
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== thinkingMsg.id),
        { id: `cam_err_${Date.now()}`, role: 'assistant', content: 'Algo se ha liado en la cocina, arma. Inténtalo de nuevo.' },
      ]);
    } finally {
      setIsIdentifying(false);
    }
  }, [closeCamera, isIdentifying, sessionId]);

  // Indicador de tokens restantes
  const userTurns      = messages.filter(m => m.role === 'user').length;
  const turnsLeft      = MAX_MESSAGES / 2 - userTurns;  // aproximado en pares
  const showTurnWarning = turnsLeft <= 3 && turnsLeft > 0;

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat con El Curro, maitre virtual"
          className="fixed bottom-4 right-4 z-50 w-20 h-20 rounded-full shadow-2xl overflow-hidden border-4 border-amber-600 hover:scale-110 transition-transform bg-white"
        >
          <Image
            src="/images/logo_curro_maitre.png"
            alt="El Curro — Maitre virtual de Andaluzzia"
            width={80}
            height={80}
            className="object-cover w-full h-full"
            priority
          />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 w-96 max-h-[620px] bg-white rounded-2xl shadow-2xl border-2 border-amber-600 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300 flex-shrink-0">
                  <Image
                    src="/images/logo_curro_maitre.png"
                    alt="El Curro"
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">El Curro</h3>
                  <p className="text-amber-200 text-xs">Maitre virtual · Andaluzzia</p>
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                  <span className="text-amber-300 text-xs">En línea</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="text-white hover:text-amber-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Aviso de límite próximo */}
            {showTurnWarning && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Quedan {turnsLeft} preguntas en esta sesión.</span>
              </div>
            )}

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 bg-amber-50 space-y-4 min-h-[300px]">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-amber-300">
                      {message.role === 'assistant' ? (
                        <Image
                          src="/images/logo_curro_maitre.png"
                          alt="El Curro"
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-amber-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Tú</span>
                        </div>
                      )}
                    </div>

                    {/* Burbuja */}
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-amber-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 shadow-md rounded-tl-none border border-amber-200'
                    }`}>
                      {message.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-300 flex-shrink-0">
                    <Image src="/images/logo_curro_maitre.png" alt="El Curro escribiendo" width={32} height={32} className="object-cover" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-md border border-amber-200">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Límite alcanzado */}
              {limitReached && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3"
                >
                  Sesión finalizada. ¡Hasta pronto, arma! 🤵
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2"
                >
                  {error}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-amber-200">
              {!limitReached ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value.slice(0, MAX_MSG_CHARS))}
                    placeholder="Pregúntale algo al Curro..."
                    disabled={isLoading}
                    maxLength={MAX_MSG_CHARS}
                    className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-full focus:outline-none focus:border-amber-600 transition-colors text-sm"
                  />
                  {/* Botón cámara */}
                  <button
                    type="button"
                    onClick={openCamera}
                    disabled={isLoading || isIdentifying}
                    aria-label="Identificar tapa con la cámara"
                    className="w-11 h-11 bg-amber-100 hover:bg-amber-200 disabled:bg-amber-50 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    {isIdentifying
                      ? <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                      : <Camera  className="w-5 h-5 text-amber-700" />
                    }
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-11 h-11 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMessages([WELCOME_MSG]); setLimitReached(false); setInput(''); setSessionId(''); }}
                  className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full text-sm font-semibold transition-colors"
                >
                  Nueva conversación
                </button>
              )}
              {input.length > MAX_MSG_CHARS * 0.85 && (
                <p className="text-xs text-amber-500 mt-1 text-right">{input.length}/{MAX_MSG_CHARS}</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal de cámara ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85"
            onClick={e => { if (e.target === e.currentTarget) closeCamera(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{ scale: 0.9,    opacity: 0 }}
              className="bg-gray-900 border border-amber-700/40 rounded-2xl p-4 flex flex-col gap-3 w-[92vw] max-w-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-amber-400 font-semibold text-sm">📸 ¿Qué tapa es esa, miarma?</p>
                <button onClick={closeCamera} aria-label="Cerrar cámara" className="text-white/50 hover:text-white text-xl leading-none">✕</button>
              </div>

              {cameraError ? (
                <p className="text-red-400 text-sm text-center py-6">{cameraError}</p>
              ) : (
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {!cameraError && (
                <button
                  onClick={captureAndIdentify}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-full transition-colors text-sm"
                >
                  📷 ¡Esto es! Identifica la tapa
                </button>
              )}

              <p className="text-center text-white/30 text-xs">Apunta la cámara a tu tapa y dale al botón</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
