# StartupPitch AI

> **The AI co-founder that helps entrepreneurs transform ideas into investment-ready businesses.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)

An open-source, AI-powered platform that helps entrepreneurs, students, incubators, and hackathon participants create professional business pitches using Large Language Models.

---

## ✨ Features (MVP)

- **4 pitch templates** — Lean Canvas, Elevator Pitch, Investor Pitch, Executive Summary
- **Multi-provider AI** — OpenAI (GPT-4o) and Anthropic (Claude) with automatic fallback
- **Bilingual** — Full English / French interface (auto-detected)
- **Export** — TXT, PDF, and JSON formats
- **History** — Save and revisit up to 50 pitches (localStorage)
- **Rate limiting** — Configurable per-minute request caps on the backend
- **Clean architecture** — Feature-based folder structure, strict TypeScript

---

## 🚀 Getting started

### Prerequisites

- Node.js 18+
- npm 9+
- At least one API key: [OpenAI](https://platform.openai.com/) or [Anthropic](https://console.anthropic.com/)

### 1. Clone

```bash
git clone https://github.com/your-org/startuppitch-ai.git
cd startuppitch-ai
```

### 2. Frontend setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL if needed (default: /api proxied to localhost:3001)
npm run dev
```

### 3. Backend setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and/or ANTHROPIC_API_KEY
npm run dev
```

The app runs at **http://localhost:5173** and the API at **http://localhost:3001**.

---

## 🗂️ Project structure

```
startuppitch-ai/
├── src/                        # Frontend (Vite + React + TypeScript)
│   ├── features/
│   │   ├── pitch-generator/    # Form, result display, hooks
│   │   └── history/            # Saved pitches management
│   ├── shared/
│   │   ├── components/         # Layout, Navbar, LanguageToggle
│   │   └── hooks/              # useLocalStorage
│   ├── services/api/           # HTTP client → backend
│   ├── i18n/                   # EN / FR translations
│   ├── types/                  # Shared TypeScript types
│   └── pages/                  # HomePage, HistoryPage
│
└── server/                     # Backend (Node.js + Express + TypeScript)
    └── src/
        ├── services/
        │   ├── ai/             # Provider abstraction (OpenAI, Anthropic)
        │   └── pitch/          # Prompt templates
        ├── routes/             # /api/pitch/*
        └── middleware/         # Rate limiter, error handler
```

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite, React 18, TypeScript |
| Styling | Tailwind CSS + Bootstrap (utilities) + shadcn/ui |
| Forms | React Hook Form + Zod |
| i18n | i18next + react-i18next |
| Backend | Node.js, Express, TypeScript |
| AI | OpenAI SDK, Anthropic SDK |
| Export | jsPDF |

---

## 🔑 Environment variables

### Frontend (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Backend base URL |

### Backend (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | One of the two | OpenAI API key |
| `ANTHROPIC_API_KEY` | One of the two | Anthropic API key |
| `DEFAULT_AI_PROVIDER` | `openai` | Default provider |
| `PORT` | `3001` | Server port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `RATE_LIMIT_MAX_REQUESTS` | `20` | Max requests per window |

---

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md).

---

## 🤝 Contributing

All contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

---

## 📄 License

[MIT](./LICENSE) — free for personal and commercial use.
