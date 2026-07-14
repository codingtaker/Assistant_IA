/** Supported AI provider identifiers. Widened to string to support any backend-registered provider. */
export type AIProvider = string;

/** UI language codes supported by the i18n system. */
export type Language = "en" | "fr";

/**
 * Available pitch document templates.
 * Each template maps to a distinct prompt schema on the backend.
 */
export type PitchTemplate =
  | "lean-canvas"
  | "elevator-pitch"
  | "investor-pitch"
  | "executive-summary";

/** A single named section within a generated pitch document. */
export interface PitchSection {
  /** Display title of the section (e.g. "Problem", "Solution"). */
  title: string;
  /** AI-generated textual content for this section. */
  content: string;
}

/**
 * The complete output of a successful pitch generation request.
 * Stored in localStorage history and used across PitchResult / HistoryList.
 */
export interface GeneratedPitch {
  /** UUID assigned by the backend at generation time. */
  id: string;
  /** Template that was used to structure this pitch. */
  template: PitchTemplate;
  /** Provider that generated the pitch (e.g. "openai", "groq", "anthropic"). */
  provider: string;
  /** Model identifier returned by the provider (e.g. "gpt-4o"). */
  model: string;
  /** User-provided project name, echoed from the request. */
  projectName: string;
  /** Ordered list of structured sections parsed from the LLM response. */
  sections: PitchSection[];
  /** Raw JSON string returned by the LLM before parsing (useful for debugging). */
  rawContent: string;
  /** ISO 8601 timestamp set by the backend at generation time. */
  generatedAt: string;
}

/** Values collected by PitchForm and sent to the backend generation endpoint. */
export interface PitchFormValues {
  projectName: string;
  description: string;
  targetMarket: string;
  uniqueValue: string;
  /** Optional comma-separated list of key features. */
  features?: string;
  template: PitchTemplate;
  /** AI provider chosen by the user; defaults to the first available provider. */
  provider: AIProvider;
}