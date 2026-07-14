import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles } from "lucide-react";
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
import { TemplateCard } from "./TemplateCard";
import type { PitchFormValues, PitchTemplate } from "@/types";

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
  provider: z.enum(["openai", "anthropic"]),
});

interface PitchFormProps {
  onSubmit: (values: PitchFormValues) => void;
  isLoading: boolean;
  availableProviders: string[];
}

export function PitchForm({ onSubmit, isLoading, availableProviders }: PitchFormProps) {
  const { t } = useTranslation();

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
      provider: (availableProviders[0] as "openai" | "anthropic") ?? "openai",
    },
  });

  const selectedTemplate = watch("template");

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

        {/* Provider selector */}
        {availableProviders.length > 1 && (
          <div className="space-y-1.5">
            <Label htmlFor="provider">{t("form.provider")}</Label>
            <Select
              onValueChange={(v) => setValue("provider", v as "openai" | "anthropic")}
              defaultValue={availableProviders[0]}
            >
              <SelectTrigger id="provider" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p === "openai" ? "OpenAI (GPT-4o)" : "Anthropic (Claude)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
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
