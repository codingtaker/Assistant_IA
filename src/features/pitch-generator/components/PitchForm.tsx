import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles, Cpu, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TemplateCard } from "./TemplateCard";
import type { PitchFormValues, PitchTemplate } from "@/types";
import type { ProviderInfo } from "@/services/api/pitch";

const TEMPLATES: PitchTemplate[] = [
  "lean-canvas",
  "elevator-pitch",
  "investor-pitch",
  "executive-summary",
];

const schema = z.object({
  projectName: z.string().min(2, "Required"),
  description: z.string().min(10, "Required (min 10 characters)"),
  targetMarket: z.string().min(5, "Required"),
  uniqueValue: z.string().min(5, "Required"),
  features: z.string().optional(),
  template: z.enum([
    "lean-canvas",
    "elevator-pitch",
    "investor-pitch",
    "executive-summary",
  ]),
  provider: z.string().min(1),
});

interface PitchFormProps {
  onSubmit: (values: PitchFormValues) => void;
  isLoading: boolean;
  /** Full provider objects from /api/pitch/providers — may be empty while loading. */
  availableProviders: ProviderInfo[];
}

export function PitchForm({ onSubmit, isLoading, availableProviders }: PitchFormProps) {
  const { t } = useTranslation();

  // Default to the first *configured* provider
  const defaultProvider =
    availableProviders.find((p) => p.configured)?.id ?? availableProviders[0]?.id ?? "openai";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PitchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      template: "lean-canvas",
      provider: defaultProvider,
    },
  });

  const selectedTemplate = watch("template");
  const selectedProvider = watch("provider");

  const configuredCount = availableProviders.filter((p) => p.configured).length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Template selector */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("templates.title")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl}
              template={tpl}
              selected={selectedTemplate === tpl}
              onSelect={(v) => setValue("template", v)}
            />
          ))}
        </div>
      </section>

      {/* Project details */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("form.title")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="projectName">{t("form.projectName")}</Label>
            <Input
              id="projectName"
              placeholder={t("form.projectNamePlaceholder")}
              {...register("projectName")}
            />
            {errors.projectName && (
              <p className="text-xs text-destructive">{errors.projectName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetMarket">{t("form.targetMarket")}</Label>
            <Input
              id="targetMarket"
              placeholder={t("form.targetMarketPlaceholder")}
              {...register("targetMarket")}
            />
            {errors.targetMarket && (
              <p className="text-xs text-destructive">{errors.targetMarket.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("form.description")}</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder={t("form.descriptionPlaceholder")}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="uniqueValue">{t("form.uniqueValue")}</Label>
          <Textarea
            id="uniqueValue"
            rows={2}
            placeholder={t("form.uniqueValuePlaceholder")}
            {...register("uniqueValue")}
          />
          {errors.uniqueValue && (
            <p className="text-xs text-destructive">{errors.uniqueValue.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="features">{t("form.features")}</Label>
          <Textarea
            id="features"
            rows={2}
            placeholder={t("form.featuresPlaceholder")}
            {...register("features")}
          />
        </div>

        {/* Provider selector — shows all known providers; unconfigured ones are disabled */}
        {availableProviders.length > 0 && (
          <div className="space-y-2">
            <Label>{t("form.provider")}</Label>
            <div className="flex flex-wrap gap-2">
              {availableProviders.map((p) => (
                <ProviderButton
                  key={p.id}
                  provider={p}
                  selected={selectedProvider === p.id}
                  onSelect={() => p.configured && setValue("provider", p.id)}
                />
              ))}
            </div>
            {configuredCount > 1 && (
              <p className="text-xs text-muted-foreground">
                {t("form.providerFallbackNote")}
              </p>
            )}
            {configuredCount === 0 && (
              <p className="text-xs text-destructive">
                {t("errors.noProvider")}
              </p>
            )}
          </div>
        )}
      </section>

      <Button type="submit" disabled={isLoading || configuredCount === 0} size="lg" className="w-full sm:w-auto">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("form.generating")}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {t("form.generate")}
          </>
        )}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* ProviderButton — card-style selector for a single provider                  */
/* -------------------------------------------------------------------------- */

interface ProviderButtonProps {
  provider: ProviderInfo;
  selected: boolean;
  onSelect: () => void;
}

function ProviderButton({ provider, selected, onSelect }: ProviderButtonProps) {
  const isDisabled = !provider.configured;

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onSelect}
      disabled={isDisabled}
      title={
        isDisabled
          ? `Add ${provider.id.toUpperCase()}_API_KEY to .env to enable`
          : provider.description
      }
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isDisabled
          ? "cursor-not-allowed border-border bg-muted opacity-40"
          : selected
            ? "border-primary bg-primary/5 font-medium text-primary shadow-sm"
            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
      aria-pressed={!isDisabled && selected}
      aria-disabled={isDisabled}
    >
      {provider.isLocal ? (
        <WifiOff size={13} className="shrink-0 opacity-60" />
      ) : (
        <Cpu size={13} className="shrink-0 opacity-60" />
      )}
      <span>{provider.label}</span>
      {provider.isLocal && (
        <Badge variant="outline" className="ml-0.5 px-1 py-0 text-[10px]">
          local
        </Badge>
      )}
      {isDisabled && (
        <Badge variant="outline" className="ml-0.5 px-1 py-0 text-[10px] opacity-60">
          no key
        </Badge>
      )}
    </button>
  );
}
