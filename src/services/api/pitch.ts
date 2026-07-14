import { apiClient } from "./client";
import type { GeneratedPitch, PitchFormValues } from "@/types";

/** Shape of the POST /pitch/generate response body. */
export interface GeneratePitchResponse {
  pitch: GeneratedPitch;
}

/** Shape of the GET /pitch/providers response body. */
export interface ProvidersResponse {
  /** List of provider names that are currently configured and available on the server. */
  providers: string[];
}

/**
 * Domain-specific API methods for pitch generation.
 * All methods delegate to `apiClient` and are typed end-to-end.
 */
export const pitchApi = {
  /**
   * Send a pitch generation request to the backend.
   * @param values  Form values collected from PitchForm.
   * @param language Active UI language ("en" | "fr") forwarded to the prompt builder.
   */
  generate: (values: PitchFormValues, language: string) =>
    apiClient.post<GeneratePitchResponse>("/pitch/generate", {
      ...values,
      language,
    }),

  /**
   * Fetch the list of AI providers currently configured on the backend.
   * Used on page load to show only available providers in the form.
   */
  getProviders: () =>
    apiClient.get<ProvidersResponse>("/pitch/providers"),
};
