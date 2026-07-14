import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PitchForm } from "@/features/pitch-generator/components/PitchForm";
import { PitchResult } from "@/features/pitch-generator/components/PitchResult";
import { usePitchGenerator } from "@/features/pitch-generator/hooks/usePitchGenerator";
import { useHistory } from "@/features/history/hooks/useHistory";
import { pitchApi, type ProviderInfo } from "@/services/api/pitch";
import type { PitchFormValues, GeneratedPitch } from "@/types";

/** Fallback providers shown while the backend /providers call is in-flight or fails. */
const FALLBACK_PROVIDERS: ProviderInfo[] = [
  { id: "openai",    label: "OpenAI",    description: "GPT-4o", isLocal: false },
  { id: "anthropic", label: "Anthropic", description: "Claude 3.5 Sonnet", isLocal: false },
];

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { pitch, isLoading, error, generate, reset } = usePitchGenerator();
  const { savePitch } = useHistory();
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [lastValues, setLastValues] = useState<PitchFormValues | null>(null);
  const [requestedProvider, setRequestedProvider] = useState<string | undefined>();

  useEffect(() => {
    pitchApi
      .getProviders()
      .then(({ providers }) => {
        setAvailableProviders(providers.length > 0 ? providers : FALLBACK_PROVIDERS);
      })
      .catch(() => {
        // Backend unreachable — show fallback so the form is still usable
        setAvailableProviders(FALLBACK_PROVIDERS);
      });
  }, []);

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
          <AlertDescription>{error}</AlertDescrip