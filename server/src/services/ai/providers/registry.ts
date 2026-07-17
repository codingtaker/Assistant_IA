import type { AIProvider } from "../types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { OpenAICompatibleProvider } from "./openai-compatible";

/**
 * Presets for well-known providers. Users only need to set <ID>_API_KEY;
 * base URL and default model are provided here. Any of them can still be
 * overridden with <ID>_BASE_URL / <ID>_MODEL / <ID>_HEADERS env vars.
 *
 * Add new presets here as new providers become popular.
 */
type ProviderKind = "openai" | "anthropic" | "openai-compatible";

interface ProviderPreset {
  kind: ProviderKind;
  baseURL?: string;
  defaultModel: string;
  defaultHeaders?: Record<string, string>;
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  openai: {
    kind: "openai",
    defaultModel: "gpt-4o",
  },
  anthropic: {
    kind: "anthropic",
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  rodium: {
    kind: "openai-compatible",
    baseURL: "https://api.rodiumai.io/v1",
    defaultModel: "anthropic/claude-opus-4-7",
  },
  groq: {
    kind: "openai-compatible",
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  // Google Gemini via its OpenAI-compatible endpoint
  gemini: {
    kind: "openai-compatible",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
  },
  openrouter: {
    kind: "openai-compatible",
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-3.5-sonnet",
  },
  xai: {
    kind: "openai-compatible",
    baseURL: "https://api.x.ai/v1",
    defaultModel: "grok-2-latest",
  },
  deepseek: {
    kind: "openai-compatible",
    baseURL: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  mistral: {
    kind: "openai-compatible",
    baseURL: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
  },
  together: {
    kind: "openai-compatible",
    baseURL: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  },
  fireworks: {
    kind: "openai-compatible",
    baseURL: "https://api.fireworks.ai/inference/v1",
    defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct",
  },
  ollama: {
    kind: "openai-compatible",
    baseURL: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
  },
};

/**
 * Convert a provider ID into the env-var prefix used to look up its settings.
 * "openai" -> "OPENAI", "my-llm-2" -> "MY_LLM_2".
 */
function envKey(id: string): string {
  return id.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

/** Parse "Header1: v1, Header2: v2" -> { Header1: "v1", Header2: "v2" }. */
function parseHeaders(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const entries = raw
    .split(",")
    .map((h) => {
      const idx = h.indexOf(":");
      if (idx === -1) return null;
      const key = h.slice(0, idx).trim();
      const value = h.slice(idx + 1).trim();
      return key && value ? ([key, value] as const) : null;
    })
    .filter((e): e is readonly [string, string] => e !== null);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/**
 * Build one provider from env, using a preset when available.
 * Returns `null` when configuration is incomplete.
 */
function buildProvider(id: string, env: NodeJS.ProcessEnv): AIProvider | null {
  const key = envKey(id);
  const preset = PROVIDER_PRESETS[id];
  const kind: ProviderKind = preset?.kind ?? "openai-compatible";

  if (kind === "openai") return new OpenAIProvider();
  if (kind === "anthropic") return new AnthropicProvider();

  const apiKey = env[`${key}_API_KEY`];
  const baseURL = env[`${key}_BASE_URL`] ?? preset?.baseURL;
  const defaultModel = env[`${key}_MODEL`] ?? preset?.defaultModel;
  const defaultHeaders =
    parseHeaders(env[`${key}_HEADERS`]) ?? preset?.defaultHeaders;

  if (!apiKey) return null;

  if (!baseURL) {
    console.warn(`[AI] Provider "${id}" skipped: missing ${key}_BASE_URL`);
    return null;
  }
  if (!defaultModel) {
    console.warn(`[AI] Provider "${id}" skipped: missing ${key}_MODEL`);
    return null;
  }

  return new OpenAICompatibleProvider({ name: id, apiKey, baseURL, defaultModel, defaultHeaders });
}

export interface ProviderRegistry {
  providers: Map<string, AIProvider>;
  defaultProvider: string;
  /** Ordered chain of provider IDs to try when fallback is needed. */
  fallbackOrder: string[];
}

/**
 * Discover and instantiate every configured provider from environment variables.
 * Any preset provider with <ID>_API_KEY set is registered automatically.
 */
export function buildProviderRegistry(
  env: NodeJS.ProcessEnv = process.env
): ProviderRegistry {
  const orderedIds: string[] = ["openai", "anthropic"];
  for (const id of Object.keys(PROVIDER_PRESETS)) {
    if (!orderedIds.includes(id)) orderedIds.push(id);
  }
  const extras = (env.EXTRA_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const id of extras) {
    if (!orderedIds.includes(id)) orderedIds.push(id);
  }

  const providers = new Map<string, AIProvider>();
  for (const id of orderedIds) {
    const provider = buildProvider(id, env);
    if (!provider) continue;
    providers.set(id, provider);
    if (provider.isAvailable()) {
      const preset = PROVIDER_PRESETS[id];
      const info = preset?.baseURL ? ` -> ${preset.baseURL}` : "";
      console.info(`[AI] Registered provider "${id}"${info}`);
    }
  }

  const rawOrder = (env.PROVIDER_FALLBACK_ORDER ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const availableIds = orderedIds.filter((id) => providers.get(id)?.isAvailable());
  const fallbackOrder = rawOrder.length
    ? rawOrder.filter((id) => availableIds.includes(id))
    : availableIds;

  const defaultProvider = env.DEFAULT_AI_PROVIDER ?? fallbackOrder[0] ?? "openai";

  return { providers, defaultProvider, fallbackOrder };
}
