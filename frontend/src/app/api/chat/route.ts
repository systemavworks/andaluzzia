/**
 * API Route /api/chat (Next.js)
 *
 * Proxy entre el componente MaitreChat y el backend Express.
 * El backend es el responsable del contexto de BD, rate limiting,
 * límite de tokens y la llamada a Anthropic.
 *
 * Aquí solo validamos el tamaño de la petición y reenviamos.
 */

export const maxDuration = 30;

const MAX_MESSAGES = 20;      // espejo del límite del backend
const MAX_MSG_CHARS = 400;    // espejo del límite del backend

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: { role: string; content: string }[] };

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Petición inválida' }), { status: 400 });
    }

    // Truncar si el usuario manipula el historial desde el cliente
    const safeMessages = messages.slice(-MAX_MESSAGES).map(m => ({
      ...m,
      content: typeof m.content === 'string'
        ? m.content.slice(0, MAX_MSG_CHARS)
        : m.content,
    }));

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const response = await fetch(`${backendUrl}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: safeMessages }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(error, { status: response.status });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status:  200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    return new Response(
      JSON.stringify({ error: 'El Curro se ha ido un momento a la cocina. Inténtalo de nuevo.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
