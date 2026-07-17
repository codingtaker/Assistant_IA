import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ServerOff, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PitchForm } from "@/features/pitch-generator/components/PitchForm";
import { PitchResult } from "@/features/pitch-generator/components/PitchResult";
import { usePitchGenerator } from "@/features/pitch-generator/hooks/usePitchGenerator";
import { useHistory } from "@/features/history/hooks/useHistory";
import { pitchApi, type ProviderInfo } from "@/services/api/pitch";
import type { PitchFormValues, GeneratedPitch } from "@/types";

/**
 * All known providers — shown immediately while /providers is in-flight or
 * when the server is unreachable. All start as configured:false so the user
 * sees the full list even before the server responds.
 */
const ALL_KNOWN_PROVIDERS: ProviderInfo[] = [
  { id: "openai",     label: "OpenAI",     description: "GPT-4o — OpenAI flagship model",       isLocal: false, configured: false },
  { id: "anthropic",  label: "Anthropic",  description: "Claude 3.5 Sonnet — Anthropic",         isLocal: false, configured: false },
  { id: "gemini",     label: "Google Gemini", description: "Gemini 2.0 Flash — Google AI",          isLocal: false, configured: false },
  { id: "groq",       label: "Groq",       description: "Llama 3.3 70B — ultra-fast inference",  isLocal: false, configured: false },
  { id: "mistral",    label: "Mistral",    description: "Mistral Large — European AI",            isLocal: false, configured: false },
  { id: "openrouter", label: "OpenRouter", description: "Multi-model gateway",                    isLocal: false, configured: false },
  { id: "xai",        label: "xAI Grok",  description: "Grok 2 — xAI",                           isLocal: false, configured: false },
  { id: "deepseek",   label: "DeepSeek",  description: "DeepSeek Chat — cost-efficient",         isLocal: false, configured: false },
  { id: "together",   label: "Together",   description: "Llama 3.3 70B — Together AI",           isLocal: false, configured: false },
  { id: "fireworks",  label: "Fireworks",  description: "Llama 3.3 70B — Fireworks AI",          isLocal: false, configured: false },
  { id: "ollama",     label: "Ollama",     description: "Local model — runs on your machine",     isLocal: true,  configured: false },
  { id: "rodium",     label: "RodiumAI",  description: "Claude via RodiumAI proxy",              isLocal: false, configured: false },
];

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { pitch, isLoading, error, generate, reset } = usePitchGenerator();
  const { savePitch } = useHistory();
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>(ALL_KNOWN_PROVIDERS);
  const [serverError, setServerError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lastValues, setLastValues] = useState<PitchFormValues | null>(null);
  const [requestedProvider, setRequestedProvider] = useState<string | undefined>();

  const fetchProviders = useCallback(() => {
    setServerError(false);
    setRetrying(true);
    pitchApi
      .getProviders()
      .then(({ providers }) => {
        setAvailableProviders(providers.length > 0 ? providers : ALL_KNOWN_PROVIDERS);
        setServerError(false);
      })
      .catch(() => {
        setServerError(true);
      })
      .finally(() => {
        setRetrying(false);
      });
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSubmit = async (values: PitchFormValues) => {
    setLastValues(values);
    setRequestedProvider(values.provider);
    await generate(values, i18n.language.startsWith("fr") ? "fr" : "en");
  };

  const handleRegenerate = () => {
    if (lastValues) {
      reset();
      generate(lastValues, i18n.language.startsWith("fr") ? "fr" : "en");
    }
  };

  const handleSave = (p: GeneratedPitch) => {
    savePitch(p);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Hero */}
      <section className="text-center space-y-3 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl whitespace-pre-line">
          {t("hero.title")}
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          {t("hero.subtitle")}
        </p>
      </section>

      <Separator />

      {/* Server unreachable warning */}
      {serverError && (
        <Alert variant="destructive">
          <ServerOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>
              Serveur backend inaccessible — lance{" "}
              <code className="mx-1 rounded bg-destructive/20 px-1 text-xs">
                cd server &amp;&amp; npm run dev
              </code>{" "}
              puis réessaie.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProviders}
              disabled={retrying}
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      {!pitch && (
        <PitchForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          availableProviders={availableProviders}
        />
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {pitch && (
        <PitchResult
          pitch={pitch}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
          requestedProvider={requestedProvider}
        />
      )}

      {pitch && (
        <div className="pb-4 text-center">
          <button
            onClick={reset}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            ← New pitch
          </button>
        </div>
      )}
    </div>
  );
}
