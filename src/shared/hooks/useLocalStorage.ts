import { useState, useCallback } from "react";

/**
 * Generic React hook that synchronises a piece of state with `localStorage`.
 *
 * - Reads the initial value from `localStorage` on mount; falls back to
 *   `initialValue` if the key is absent or the stored data is corrupt.
 * - Exposes a stable `setValue` that writes to both React state and storage.
 * - Exposes `removeValue` to delete the key and reset state.
 * - All storage access is wrapped in try/catch so a `QuotaExceededError` or
 *   corrupt JSON never crashes the component tree.
 *
 * @template T Type of the stored value — must be JSON-serialisable.
 * @param key          localStorage key.
 * @param initialValue Fallback used when the key is absent or unreadable.
 * @returns A tuple of `[storedValue, setValue, removeValue]` (same API as useState + remove).
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`useLocalStorage: failed to set "${key}"`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`useLocalStorage: failed to remove "${key}"`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
