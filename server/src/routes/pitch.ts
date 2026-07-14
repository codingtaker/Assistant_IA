import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { aiService } from "../services/ai";
import { buildPrompts } from "../services/pitch/prompts";
import { pitchRateLimiter } from "../middleware/rateLimiter";
import { PROVIDER_PRESETS } from "../services/ai/providers/registry";
import type { PitchRequestBody, GeneratedPitch } from "../types";

const router = Router();

const PitchRequestSchema = z.object({
  projectName: z.string().min(2).max(120),
  description: z.string().min(10).max(1000),
  targetMarket: z.string().min(5).max(500),
  uniqueValue: z.string().min(5).max(500),
  features: z.string().max(500).optional(),
  template: z.enum(["lean-canvas", "elevator-pitch", "investor-pitch", "executive-summary"]),
  provider: z.string().min(1).max(64).optional(),
  language: z.enum(["en", "fr"]).optional(),
});

/**
 * Human-readable display names for well-known provider IDs.
 * Kept here (rather than in registry.ts) to avoid coupling display concerns
 * with the provider construction logic.
 */
const PROVIDER_DISPLAY: Record<string, { label: string; description: string }> = {
  openai:     { label: "OpenAI",     description: "GPT-4o — OpenAI flagship model" },
  anthropic:  { label: "Anthropic",  description: "Claude 3.5 Sonnet — Anthropic" },
  groq:       { label: "Groq",       description: "Llama 3.3 70B — ultra-fast inference" },
  mistral:    { label: "Mistral",    description: "Mistral Large — European AI" },
  openrouter: { label: "OpenRouter", description: "Multi-model gateway" },
  xai:        { label: "xAI Grok",  description: "Grok 2 — xAI" },
  deepseek:   { label: "DeepSeek",  description: "DeepSeek Chat — cost-efficient" },
  together:   { label: "Together",   description: "Llama 3.3 70B — Together AI" },
  fireworks:  { label: "Fireworks",  description: "Llama 3.3 70B — Fireworks AI" },
  ollama:     { label: "Ollama",     description: "Local model — runs on your machine" },
  rodium:     { label: "RodiumAI",   description: "Claude via RodiumAI proxy" },
};

// GET /api/pitch/providers — list available providers with display metadata
router.get("/providers", (_req: Request, res: Response) => {
  const available = aiService.getAvailableProviders();

  const providers = available.map((id) => {
    const display = PROVIDER_DISPLAY[id];
    const preset = PROVIDER_PRESETS[id];
    return {
      id,
      label: display?.label ?? id,
      description: display?.description ?? preset?.defaultModel ?? id,
      isLocal: id === "ollama" || (preset as { baseURL?: string } | undefined)?.baseURL