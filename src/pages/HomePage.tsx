import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PitchForm } from "@/features/pitch-generator/components/PitchForm";
import { PitchResult } from "@/features/pitch-generator/components/PitchResult";
import { usePitchGenerator } from "@/features/pitch-generator/hooks/usePitchGenerator";
import { useHistory } from "@/features/history/hooks/useHistory";
import { pitchApi } from "@/services/api/pitch";
import type { PitchFormValues, GeneratedPitch } from "@/types";

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { pitch, isLoading, error, generate, reset } = usePitchGenerator();
  const { savePitch } = useHistory();
  const [availableProviders, setAvailableProviders] = useState<string[]>(["openai"]);
  const [lastValues, setLastValues] = useState<PitchFormValues | null>(null);

  useEffect(() => {
    pitchApi.getProviders().then(({ providers }) => {
      if (providers.length > 0) setAvailableProviders(providers);
    }).catch(() => {
      // Backend not running: default to showing both providers in UI
      setAvailableProviders(["openai", "anthropic"]);
    });
  }, []);

  const handleSubmit = async (values: PitchFormValues) => {
    setLastValues(values);
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
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles size={12} />
          {t("nav.tagline")}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl whitespace-pre-line">
          {t("hero.title")}
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          {t("hero.subtitle")}
        </p>
      </section>

      <Separator />

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
