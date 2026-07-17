import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles, Cpu, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  availableProviders: ProviderInfo[];
}

export function PitchForm({ onSubmit, isLoading, availableProviders }: PitchFormProps) {
  const { t } = useTranslation();

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

  const configuredProviders = availableProviders.filter((p) => p.configured);
  const configuredCount = configuredProviders.length;
  const selectedProviderInfo = availableProviders.find((p) => p.id === selectedProvider);

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

        {/* Provider dropdown */}
        <div className="space-y-2">
          <Label>{t("form.provider")}</Label>

          {configuredCount === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{t("errors.noProvider")}</span>
            </div>
          ) : (
            <Select
              value={selectedProvider}
              onValueChange={(v) => setValue("provider", v)}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue>
                  {selectedProviderInfo ? (
                    <span className="flex items-center gap-2">
                      {selectedProviderInfo.isLocal ? (
                        <WifiOff size={13} className="shrink-0 opacity-60" />
                      ) : (
                        <Cpu size={13} className="shrink-0 opacity-60" />
                      )}
                      {selectedProviderInfo.label}
                    </span>
                  ) : (
                    t("form.provider")
                  )}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {/* Configured providers first */}
                {configuredProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="shrink-0 text-primary" />
                      <span>{p.label}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{p.description}</span>
                    </span>
                  </SelectItem>
                ))}

                {/* Unconfigured providers — shown but grayed out and not selectable */}
                {availableProviders
                  .filter((p) => !p.configured)
                  .map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      disabled
                      className={cn("opacity-40")}
                    >
                      <span className="flex items-center gap-2">
                        {p.isLocal ? (
                          <WifiOff size={13} className="shrink-0" />
                        ) : (
                          <Cpu size={13} className="shrink-0" />
                        )}
                        <span>{p.label}</span>
                        <span className="ml-1 text-xs text-muted-foreground">no key</span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          {configuredCount > 1 && (
            <p className="text-xs text-muted-foreground">
              {t("form.providerFallbackNote")}
            </p>
          )}
        </div>
      </section>

      <Button
        type="submit"
        disabled={isLoading || configuredCount === 0}
        size="lg"
        className="w-full sm:w-auto"
      >
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
