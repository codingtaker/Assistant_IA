import { apiClient } from "./client";
import type { GeneratedPitch, PitchFormValues } from "@/types";

/** Shape of the POST /pitch/generate response body. */
export interface GeneratePitchResponse {
  pitch: GeneratedPitch;
}

/** Metadata for a single AI provider returned by /api/pitch/providers. */
export interface ProviderInfo {
  /** Internal provider ID sent in generation requests (e.g. "openai", "groq"). */
  id: string;
  /** Human-readable display name (e.g. "OpenAI", "Groq"). */
  label: string;
  /** Short description of the provider / model (e.g. "GPT-4o — OpenAI flagship model"). */
  description: string;
  /** True for providers running locally (Ollama etc.). */
  isLocal: boolean;
}

/** Shape of the GET /pitch/providers response body. */
export interface ProvidersResponse {
  /** List of configured and available providers with display metadata. */
  providers: ProviderInfo[];
}

/**
 * Domain-specific API methods for pitch generation.
 * All methods delegate to `apiClient` and are typed end-to-end.
 */
export const pitchApi = {
  /**
   * Send a pitch generation request to the backend.
   * @param values   Form values collected from PitchForm.
   * @param language 