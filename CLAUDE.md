# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StartupPitch AI** — an open-source AI platform that transforms business ideas into investor-ready pitches. The long-term vision is an AI co-founder that validates ideas, builds business models, and generates investor materials.

## Commands

### Frontend (root)
```bash
npm run dev          # Vite dev server on :5173
npm run build        # tsc + vite build
npm run typecheck    # type-check without emit
npm run lint         # ESLint with zero warnings allowed
```

### Backend (server/)
```bash
cd server
npm run dev          # ts-node-dev watch mode on :3001
npm run build        # tsc to dist/
npm start            # run compiled dist/index.js
```

### Environment
Copy `server/.env.example` to `server/.env` and fill in at least one `*_API_KEY`. The server refuses to start without at least one provider key (no hard crash — it will respond with a 500 on generation requests).

## Architecture

### Frontend (`src/`)
- **Vite + React 18 + TypeScript**, Tailwind CSS with shadcn/ui components
- `src/App.tsx` — root: `ThemeProvider` → `QueryClientProvider` → `TooltipProvider` → `BrowserRouter` → `Layout`
- Two pages: `HomePage` (pitch generator) and `HistoryPage` (localStorage-backed history)
- `src/shared/contexts/ThemeContext.tsx` — dark/light/system theme, applies `.dark` to `<html>`, persisted in `localStorage("startuppitch-theme")`
- `src/shared/components/` — `Navbar`, `Footer`, `Layout`, `ThemeToggle`, `LanguageToggle`
- `src/features/pitch-generator/` — `PitchForm` (provider selector + form) and `PitchResult` (export + fallback badge)
- `src/services/api/pitch.ts` — typed API client; `ProviderInfo.configured: boolean` flags whether the provider has a key set
- i18n via `react-i18next` with `src/i18n/locales/en.ts` and `fr.ts` (keys nested under `translation.*`)

### Backend (`server/src/`)
- **Express + TypeScript**, single entry `src/index.ts` on port 3001
- Routes: `GET /health`, `POST /api/pitch/generate`, `GET /api/pitch/providers`
- `services/ai/index.ts` — exports the singleton `aiService = new AIService(buildProviderRegistry())`. **Always import this singleton; never instantiate AIService directly.**
- `services/ai/providers/registry.ts` — `buildProviderRegistry()` auto-discovers every provider in `PROVIDER_PRESETS` that has a `<ID>_API_KEY` env var. No manual registration needed for preset providers.
- `PROVIDER_PRESETS` (11 entries): `openai`, `anthropic`, `rodium`, `groq`, `openrouter`, `xai`, `deepseek`, `mistral`, `together`, `fireworks`, `ollama`
- Provider implementations: `OpenAIProvider`, `AnthropicProvider` (native SDKs), `OpenAICompatibleProvider` (shared for all others)
- `AIService.complete()` iterates providers via `planAttempts()`, catching retryable errors (billing, 429, 5xx, network) and falling back automatically
- `isBillingError()` covers Anthropic's HTTP 400 `"credit balance is too low"` via `BILLING_MESSAGE_RE` and nested `err.error.error.message` inspection

### Adding a New Provider
1. Add a preset entry to `PROVIDER_PRESETS` in `registry.ts` (kind, baseURL, defaultModel)
2. Add display metadata to `PROVIDER_DISPLAY` in `routes/pitch.ts`
3. Set `<ID>_API_KEY` in `.env` — provider auto-registers on startup

### Color Palette (strict)
Three colors from the favicon only — **no blue, no blue-gray**:
- Indigo `#6366f1` → `hsl(239 84% 67%)` — primary
- Cyan `#a5f3fc` → `hsl(186 95% 90%)` — accent
- Pure gray neutrals (saturation 0%) — muted/border/background
- Tailwind config: `darkMode: ["class"]`; all tokens via CSS custom properties in `src/index.css`

### Known Pitfalls
- **File truncation on Windows**: The Edit/Write tools sometimes write truncated files on disk (CRLF + buffer issue). Always verify with `wc -l` and `tail` after writing. Fix: rewrite the full file via `bash cat > file << 'ENDOFFILE'`.
- **Git CRLF**: Run `git add --renormalize <file>` when `git diff HEAD` shows nothing but the file is flagged as modified.
- **`aiService` singleton**: Must be exported from `services/ai/index.ts`. If the `/providers` endpoint returns 500, this is the first thing to check.
- **Anthropic billing (HTTP 400)**: Not a standard 402 — caught by `BILLING_MESSAGE_RE` and the nested `err.error.error` check in `isBillingError()`.
