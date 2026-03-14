# 🍽️ Andaluzzia.es — Restaurante Sevillano con IA

## Stack
| Capa         | Tecnología                        |
|--------------|-----------------------------------|
| Frontend     | Next.js 14 + Vercel               |
| Backend      | Express + Railway                 |
| IA           | Claude 3.5 Sonnet (Anthropic)     |
| Base de datos| MongoDB Atlas                     |
| Imágenes     | Cloudinary                        |
| Pagos        | Stripe                            |
| WhatsApp     | Twilio Business API               |

## Quick Start

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Accede en: http://localhost:3000  
API en:     http://localhost:3001

## Variables de entorno

```bash
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example         backend/.env
# Rellena los valores con tus credenciales
```

## Deploy
- **Frontend** → Vercel
- **Backend**  → Railway
- **DB**       → MongoDB Atlas
