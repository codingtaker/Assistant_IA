export type AIProvider = string;

export type PitchTemplate =
  | "lean-canvas"
  | "elevator-pitch"
  | "investor-pitch"
  | "executive-summary";

export interface PitchRequestBody {
  projectName: string;
  description: string;
  targetMarket: string;
  uniqueValue: string;
  features?: string;
  template: PitchTemplate;
  provider?: AIProvider;
  language?: "en" | "fr";
}

export interface PitchSection {
  title: string;
  content: string;
}

export interface GeneratedPitch {
  id: string;
  template: PitchTemplate;
  provider: AIProvider;
  model: string;
  projectName: string;
  sections: PitchSection[];
  rawContent: string;
  generatedAt: string;
}

export interface APIError {
  message: string;
  code?: string;
  statusCode: number;
}
