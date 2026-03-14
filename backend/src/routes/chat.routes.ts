/**
 * Ruta POST /api/chat
 * Recibe el historial de mensajes del usuario y devuelve la respuesta
 * de "El Curro" (Claude) con contexto completo de la BD.
 *
 * Límite de tokens por conversación: MAX_TOKENS_PER_CONV (configurable en .env)
 * Si la conversación supera el límite, se responde con un mensaje de cierre amable.
 */

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { Plato }           from '../models/Plato';
import { Mesa }            from '../models/Mesa';
import { HorarioEspecial } from '../models/HorarioEspecial';
import { chatLimiter }     from '../middlewares/rateLimit.middleware';
import { logger }          from '../utils/logger';

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Límites de la conversación
const MAX_TOKENS_RESPONSE  = 350;          // max tokens por respuesta del maitre
const MAX_MESSAGES_IN_CONV = 20;           // max turnos de conversación antes de cerrar
const MAX_USER_MSG_CHARS   = 400;          // max caracteres por mensaje del usuario

router.post('/', chatLimiter, async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages: { role: string; content: string }[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Mensajes inválidos' });
      return;
    }

    // ── Límite de longitud de conversación ──────────────────────────────────
    if (messages.length > MAX_MESSAGES_IN_CONV) {
      res.json({
        content: '¡Anda, que lleva usted un buen rato aquí! Me alegra mucho haberle atendido, arma. Si tiene más preguntas mañana, aquí estará el Curro. ¡Hasta pronto y que aproveche! 🤵',
        limitReached: true,
      });
      return;
    }

    // ── Sanitizar el último mensaje del usuario ─────────────────────────────
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
    if (lastUserMsg && lastUserMsg.content.length > MAX_USER_MSG_CHARS) {
      lastUserMsg.content = lastUserMsg.content.slice(0, MAX_USER_MSG_CHARS);
    }

    // ── Cargar contexto de la BD (solo lo necesario) ────────────────────────
    const [platosDisponibles, mesas, horarioHoy] = await Promise.all([
      Plato.find({ disponible: true })
           .select('nombre descripcion precio categoria esRecomendado esPlatoDia esLoMasRico maridaje origen alergenos')
           .sort({ orden: 1 })
           .lean(),
      Mesa.find({ activa: true }).select('zona capacidad notas').lean(),
      HorarioEspecial.findOne({
        fecha:  { $gte: new Date(new Date().setHours(0,0,0,0)), $lt: new Date(new Date().setHours(23,59,59,999)) },
        activo: true,
      }).lean(),
    ]);

    const platoDia    = platosDisponibles.find(p => p.esPlatoDia);
    const loMasRico   = platosDisponibles.filter(p => p.esLoMasRico);
    const recomendados = platosDisponibles.filter(p => p.esRecomendado);

    // ── System prompt completo con contexto de BD ───────────────────────────
    const systemPrompt = `Eres "El Curro", el maitre virtual de Andaluzzia, un restaurante tradicional sevillano en Triana, Sevilla.

PERSONALIDAD:
- Cercano, amable, con salero sevillano auténtico (sin caricatura excesiva)
- Expresiones naturales: "miarma", "arma", "quédate a gusto", "pa chuparse los dedos", "ole"
- Profesional pero cálido — el camarero de confianza del barrio de toda la vida
- NUNCA inventas datos ni platos que no estén en el menú proporcionado
- Respuestas CORTAS: máximo 3-4 frases. El usuario puede preguntar más si quiere.

TUS FUNCIONES:
1. Recomendar tapas y platos usando SOLO el menú siguiente
2. Sugerir maridajes (sobre todo con Cruzcampo)
3. Informar sobre reservas y derivar al formulario de la web
4. Contar la historia y curiosidades de los platos y de Sevilla
5. Informar del horario, ubicación y disponibilidad de mesas
6. Si preguntan por alergenos, dar la información exacta del menú

HORARIO NORMAL: Martes a Domingo 12:00–00:00 | Lunes CERRADO
UBICACIÓN: Calle Betis, 45 — Triana, Sevilla
TELÉFONO: 954 00 00 00
CAPACIDAD TOTAL: ${mesas.reduce((acc, m) => acc + m.capacidad, 0)} personas

${horarioHoy ? `⚠️ AVISO HOY: ${horarioHoy.descripcion}${horarioHoy.tipo === 'horario_reducido' ? ` (${horarioHoy.horaApertura}–${horarioHoy.horaCierre})` : ''}` : ''}

${platoDia ? `PLATO DEL DÍA: ${platoDia.nombre} (${platoDia.precio}€) — ${platoDia.descripcion}` : ''}

LO MÁS RICO (selección del Curro):
${loMasRico.map(p => `- ${p.nombre} (${p.precio}€): ${p.descripcion.slice(0, 80)}...`).join('\n')}

LO MÁS PEDIDO:
${recomendados.map(p => `- ${p.nombre} (${p.precio}€)`).join('\n')}

CARTA COMPLETA:
${JSON.stringify(platosDisponibles.map(p => ({
  nombre: p.nombre, precio: p.precio, categoria: p.categoria,
  descripcion: p.descripcion.slice(0, 100),
  maridaje: p.maridaje, alergenos: p.alergenos,
})))}`;

    // ── Llamada a Claude ────────────────────────────────────────────────────
    const anthropicMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await client.messages.create({
      model:      'claude-3-5-sonnet-20241022',
      max_tokens: MAX_TOKENS_RESPONSE,
      system:     systemPrompt,
      messages:   anthropicMessages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    logger.debug(`Chat IA — ${response.usage.input_tokens} in / ${response.usage.output_tokens} out tokens`);

    res.json({
      content:      text,
      limitReached: false,
      usage: {
        inputTokens:  response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    logger.error('Error en chat IA:', error);
    res.status(500).json({ error: 'El Curro se ha ido un momento a la cocina. Inténtalo de nuevo.' });
  }
});

export default router;
