import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import type { GeneratedPitch } from "@/types";

/** localStorage key used to persist the user's pitch history. */
const STORAGE_KEY = "startuppitch-history";

/**
 * Hook that manages the user's local pitch history.
 *
 * Pitches are stored newest-first and capped at 50 entries to keep
 * localStorage usage reasonable. Duplicate saves (same `id`) are silently ignored.
 *
 * @returns
 * - `pitches`      — ordered array of saved pitches (newest first).
 * - `savePitch`    — adds a pitch; no-op if the id already exists.
 * - `deletePitch`  — removes a pitch by id.
 * - `clearHistory` — wipes all saved pitches and removes the localStorage key.
 */
export function useHistory() {
  const [pitches, setPitches, clearHistory] = useLocalStorage<GeneratedPitch[]>(
    STORAGE_KEY,
    []
  );

  /** Add a generated pitch to history. Silently skips duplicates (same `id`). */
  const savePitch = (pitch: GeneratedPitch) => {
    setPitches((prev) => {
      const exists = prev.some((p) => p.id === pitch.id);
      if (exists) return prev;
      return [pitch, ...prev].slice(0, 50); // cap at 50 entries
    });
  };

  /** Remove a pitch from history by its unique id. */
  const deletePitch = (id: string) => {
    setPitches((prev) => prev.filter((p) => p.id !== id));
  };

  return { pitches, savePitch, deletePitch, clearHistory };
}
