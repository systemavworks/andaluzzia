# Andaluzzia Web

Proyecto full-stack para la web de Andaluzzia, con carta dinámica, backend API, integración con Supabase y documentos comerciales en HTML listos para local/impresión.

## Stack
| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 + Tailwind |
| Backend | Express + TypeScript |
| IA | Anthropic / OpenAI (según configuración) |
| Base de datos | Supabase (PostgreSQL) |
| Imágenes | Cloudinary |
| Pagos | Stripe |
| WhatsApp | Twilio Business API |

## Estructura principal
- `frontend/`: aplicación Next.js.
- `backend/`: API Express + scripts de sincronización.
- `files/`: HTML comerciales y material auxiliar para demos/presupuestos.

## Arranque local

### 1) Instalar dependencias
```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2) Configurar variables de entorno
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Variables mínimas críticas en backend:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3) Ejecutar en desarrollo
```bash
# Terminal 1
npm --prefix backend run dev

# Terminal 2
npm --prefix frontend run dev
```

URLs por defecto:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API rápida
- `GET /api/menu`
- Filtros soportados: `categoria`, `disponible`

## Sincronización de carta (HTML -> Supabase)
El script toma la carta embebida en `frontend/public/index.html` y hace upsert en tabla `tapas`.

```bash
npm --prefix backend run sync:carta
```

Requisitos:
- Migraciones de esquema aplicadas en Supabase.
- Seed inicial ejecutado si es un entorno nuevo.

## Demo local offline
`frontend/public/index.html` está preparado para abrirse también en local (`file://`) con fallback de datos embebidos.

## Documentos comerciales
Archivos listos para abrir en navegador e imprimir en A4:
- `files/propuesta_web_reycerveza.html`
- `files/server_presupuesto.html`

Ambos incluyen logo embebido en base64 para funcionar sin depender de URLs externas.

## Build
```bash
npm --prefix backend run build
npm --prefix frontend run build
```

## Deploy recomendado
- Frontend: Vercel
- Backend: Railway
- Base de datos: Supabase
