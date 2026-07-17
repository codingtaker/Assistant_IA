# StartupPitch AI

> **The AI co-founder that helps entrepreneurs transform ideas into investment-ready businesses.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)

An open-source, AI-powered platform that helps entrepreneurs, students, incubators, and hackathon participants create professional business pitches using Large Language Models.

> **Note:** For testing, **Groq** (Llama 3.3 70B) is currently the recommended free provider — fast inference and a generous free tier. OpenAI, Anthropic, Gemini, RodiumAI and others are supported but require paid API keys.

---

## ✨ Features (MVP)

- **4 pitch templates** — Lean Canvas, Elevator Pitch, Investor Pitch, Executive Summary
- **Multi-provider AI** — Groq, OpenAI, Anthropic, Gemini, RodiumAI, Mistral, DeepSeek, xAI and more with automatic fallback
- **Bilingual** — Full English / French interface (auto-detected)
- **Export** — TXT, PDF, and JSON formats
- **History** — Save and revisit up to 50 pitches (localStorage)
- **Dark / Light / System** theme switcher
- **Rate limiting** — Configurable per-minute request caps on the backend

---

## 🚀 Local installation

### Prerequisites

- **Node.js 18+** and **npm 9+**
- At least one AI provider API key (see table below — Groq is free)

### 1. Clone the repository

```bash
git clone https://github.com/codingtaker/Assistant_IA.git
cd Assistant_IA
```

### 2. Frontend setup

```bash
npm install
cp .env.example .env.local
# .env.local: leave VITE_API_URL commented out for local dev (proxy handles it)
npm run dev
```

### 3. Backend setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env: add at least one *_API_KEY (GROQ_API_KEY recommended for testing)
npm run dev
```

The app runs at **http://localhost:5173** and the API at **http://localhost:3001**.

> **Tip:** Keep two terminals open — one for the frontend (`npm run dev` at root) and one for the backend (`cd server && npm run dev`).

### 4. Database (optional — needed for API key quotas)

The quota system uses a PostgreSQL database (Neon). For local dev it is **disabled by default** via `REQUIRE_API_KEY=false` in `server/.env` — you can generate pitches without any database setup.

To enable quotas (production mode):

```bash
# 1. Set DATABASE_URL in server/.env (get it from Neon dashboard)
# 2. Apply the schema
cd server && npm run db:migrate
# 3. Create an API client key
npm run client:create -- "Web app" 1000
# 4. Set REQUIRE_API_KEY=true in server/.env
```

---

## 🔑 AI providers

| Provider | Free tier | Key name | Get key |
|---|---|---|---|
| **Groq** ⭐ | Yes — recommended for testing | `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| Google Gemini | Yes (limited) | `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| OpenAI | No | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| Anthropic | No | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| RodiumAI | No | `RODIUM_API_KEY` | [rodiumai.io](https://rodiumai.io) |
| Mistral | No | `MISTRAL_API_KEY` | [console.mistral.ai](https://console.mistral.ai) |
| DeepSeek | No | `DEEPSEEK_API_KEY` | [platform.deepseek.com](https://platform.deepseek.com) |
| xAI Grok | No | `XAI_API_KEY` | [console.x.ai](https://console.x.ai) |
| OpenRouter | No | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) |
| Ollama | Free (local) | `OLLAMA_API_KEY=ollama` | [ollama.com](https://ollama.com) |

Add any of these to `server/.env` and the provider activates automatically on next server restart.

---

## ☁️ Deployment

### Backend → Railway

1. Create a project on [railway.app](https://railway.app) from this GitHub repo
2. In **Settings → Source**, set **Root Directory** to `server`
3. Add environment variables in Railway:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...   # Neon connection string
REQUIRE_API_KEY=true
GROQ_API_KEY=gsk_...
# + any other provider keys
CORS_ORIGINS=https://your-app.vercel.app
```

4. Railway auto-detects `server/railway.toml` and runs the build. The health check hits `GET /health`.

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Leave Root Directory empty (project root)
3. Add environment variables:

```env
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_API_KEY=sp_live_...   # generated with: cd server && npm run client:create -- "Web app"
```

4. Deploy. Vercel detects `vercel.json` automatically.

### After deployment — create an API key

```bash
# From the server/ directory, with DATABASE_URL set in .env:
npm run client:create -- "Web app" 1000
# Copy the sp_live_... key — shown only once
```

---

## 🗂️ Project structure

```
Assistant_IA/
├── src/                        # Frontend (Vite + React + TypeScript)
│   ├── features/
│   │   ├── pitch-generator/    # Form, result, hooks
│   │   └── history/            # Saved pitches
│   ├── shared/
│   │   ├── components/         # Navbar, Footer, ThemeToggle
│   │   └── contexts/           # ThemeContext
│   ├── services/api/           # Typed HTTP client
│   ├── i18n/                   # EN / FR translations
│   └── pages/                  # HomePage, HistoryPage
│
└── server/                     # Backend (Express + TypeScript)
    └── src/
        ├── services/ai/        # Provider abstraction + fallback logic
        ├── services/pitch/     # Prompt templates (EN/FR)
        ├── routes/             # GET /providers, POST /generate
        ├── middleware/         # Auth, rate limiter, error handler
        └── db/                 # Neon pool + migrations
```

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Forms | React Hook Form + Zod |
| i18n | i18next + react-i18next |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Neon) |
| AI | 10+ providers via OpenAI SDK + Anthropic SDK |
| Export | jsPDF |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md).

---

## 🤝 Contributing

All contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

---

## 📄 License

[MIT](./LICENSE) — free for personal and commercial use.
