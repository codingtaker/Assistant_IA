import { useState, useCallback } from "react";
import { pitchApi } from "@/services/api/pitch";
import type { GeneratedPitch, PitchFormValues } from "@/types";

/** Internal state managed by usePitchGenerator. */
interface State {
  /** The last successfully generated pitch, or null if none yet / after reset. */
  pitch: GeneratedPitch | null;
  /** True while the backend request is in-flight. */
  isLoading: boolean;
  /** Human-readable error message from the last failed request, or null. */
  error: string | null;
}

/**
 * Hook that encapsulates the pitch generation lifecycle.
 *
 * Usage:
 * ```tsx
 * const { pitch, isLoading, error, generate, reset } = usePitchGenerator();
 *
 * // Trigger generation
 * await generate(formValues, "en");
 *
 * // Clear result and go back to the form
 * reset();
 * ```
 *
 * @returns State fields (`pitch`, `isLoading`, `error`) plus `generate` and `reset` actions.
 */
export function usePitchGenerator() {
  const [state, setState] = useState<State>({
    pitch: null,
    isLoading: false,
    error: null,
  });

  /**
   * Call the backend generation endpoint.
   * Resets any previous result before the request and updates state on success or failure.
   *
   * @param values   Validated form values from PitchForm.
   * @param language Active UI language code ("en" | "fr") forwarded to the backend.
   * @returns The generated pitch on success, or `null` on error.
   */
  const generate = useCallback(
    async (values: PitchFormValues, language: string) => {
      setState({ pitch: null, isLoading: true, error: null });
      try {
        const { pitch } = await pitchApi.generate(values, language);
        setState({ pitch, isLoading: false, error: null });
        return pitch;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setState({ pitch: null, isLoading: false, error: message });
        return null;
      }
    },
    []
  );

  /** Reset state to its initial value (clears pitch and error, shows form again). */
  const reset = useCallback(() => {
    setState({ pitch: null, isLoading: false, error: null });
  }, []);

  return { ...state, generate, reset };
}
