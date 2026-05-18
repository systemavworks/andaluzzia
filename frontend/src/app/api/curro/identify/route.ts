/**
 * API Route /api/curro/identify (Next.js)
 *
 * Proxy para identificación por cámara hacia el backend Express.
 */

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, sessionId } = body as {
      image?: string;
      sessionId?: string;
    };

    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: 'Petición inválida: falta image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    let response: Response;
    try {
      response = await fetch(`${backendUrl}/curro/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, sessionId }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return new Response(
        JSON.stringify({
          fallback: true,
          suggestion: 'Identificador no disponible temporalmente. Inténtalo en un momento.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /api/curro/identify:', error);
    return new Response(
      JSON.stringify({
        fallback: true,
        suggestion: 'No he podido procesar la imagen ahora mismo. Inténtalo de nuevo.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
