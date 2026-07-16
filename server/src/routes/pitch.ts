import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { aiService } from "../services/ai";
import { buildPrompts } from "../services/pitch/prompts";
import { pitchRateLimiter } from "../middleware/rateLimiter";
import { apiKeyAuth, consumeQuota } from "../middleware/auth";
import { PROVIDER_PRESETS } from "../services/ai/providers/registry";
import type { PitchRequestBody, GeneratedPitch } from "../types";

const router = Router();

const PitchRequestSchema = z.object({
  projectName: z.string().min(2).max(120),
  description: z.string().min(10).max(1000),
  targetMarket: z.string().min(5).max(500),
  uniqueValue: z.string().min(5).max(500),
  features: z.string().max(2000).optional(),
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

/**
 * Allow-list of providers a client may explicitly request via `provider`.
 *
 * Set `CLIENT_SELECTABLE_PROVIDERS=openai,groq` to limit what callers can pick
 * (e.g. only cheaper models), independent of what's configured server-side.
 * When unset, any configured provider remains selectable (backward compatible).
 * The server-side fallback chain is unaffected — this only governs the caller's
 * explicit choice.
 */
function clientSelectableProviders(): Set<string> | null {
  const raw = process.env.CLIENT_SELECTABLE_PROVIDERS?.trim();
  if (!raw) return null;
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.length ? new Set(ids) : null;
}

// GET /api/pitch/providers — list ALL known providers with display metadata and flags
router.get("/providers", (_req: Request, res: Response) => {
  const availableSet = new Set(aiService.getAvailableProviders());
  const allow = clientSelectableProviders();

  // Union of preset IDs and any provider registered from EXTRA_PROVIDERS (unknown to presets).
  const allIds = Array.from(
    new Set([...Object.keys(PROVIDER_PRESETS), ...availableSet])
  );

  const providers = allIds.map((id) => {
    const display = PROVIDER_DISPLAY[id];
    const preset = PROVIDER_PRESETS[id];
    const configured = availableSet.has(id);
    return {
      id,
      label: display?.label ?? id,
      description: display?.description ?? preset?.defaultModel ?? id,
      isLocal:
        id === "ollama" ||
        ((preset as { baseURL?: string } | undefined)?.baseURL?.includes("localhost") ?? false),
      configured,
      // Whether a client may request this provider explicitly.
      selectable: configured && (allow ? allow.has(id) : true),
    };
  });

  res.json({ providers });
});

// POST /api/pitch/generate — generate a pitch (authenticated + quota-limited)
router.post(
  "/generate",
  pitchRateLimiter,
  apiKeyAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Do NOT log req.body — it contains the user's (potentially confidential)
      // business ideas. Log only non-sensitive metadata.
      console.info(
        `[POST /generate] client="${req.client?.name}" template="${req.body?.template}" provider="${req.body?.provider ?? "default"}"`
      );

      const parseResult = PitchRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const flat = parseResult.error.flatten();
        console.warn("[POST /generate] Validation FAILED");
        res.status(400).json({
          error: {
            message: "Invalid request body",
            details: flat,
          },
        });
        return;
      }

      const body = parseResult.data as PitchRequestBody;

      // Enforce the client-selectable provider allow-list (if configured).
      const allow = clientSelectableProviders();
      if (body.provider && allow && !allow.has(body.provider)) {
        res.status(400).json({
          error: {
            message: `Provider "${body.provider}" is not selectable.`,
            code: "PROVIDER_NOT_ALLOWED",
          },
        });
        return;
      }

      const { systemPrompt, userPrompt } = buildPrompts(body);

      const aiResponse = await aiService.complete(
        { systemPrompt, userPrompt, maxTokens: 2048, temperature: 0.7 },
        body.provider
      );

      // Parse the JSON returned by the LLM
      let parsed: { sections: { title: string; content: string }[] };
      try {
        parsed = JSON.parse(aiResponse.content);
      } catch {
        // LLM returned non-JSON — wrap as single section
        parsed = {
          sections: [{ title: "Generated Pitch", content: aiResponse.content }],
        };
      }

      const pitch: GeneratedPitch = {
        id: randomUUID(),
        template: body.template,
        provider: aiResponse.provider as GeneratedPitch["provider"],
        model: aiResponse.model,
        projectName: body.projectName,
        sections: parsed.sections,
        rawContent: aiResponse.content,
        generatedAt: new Date().toISOString(),
      };

      // Charge one unit of quota only now that generation succeeded.
      const remaining = req.client ? await consumeQuota(req.client.id) : null;
      if (remaining !== null) {
        res.setHeader("X-Quota-Remaining", String(remaining));
      }

      res.status(201).json({ pitch });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
