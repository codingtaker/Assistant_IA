import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { PitchTemplate } from "@/types";
import {
  FileText,
  Zap,
  TrendingUp,
  BookOpen,
} from "lucide-react";

const ICONS: Record<PitchTemplate, React.ElementType> = {
  "lean-canvas": FileText,
  "elevator-pitch": Zap,
  "investor-pitch": TrendingUp,
  "executive-summary": BookOpen,
};

interface TemplateCardProps {
  template: PitchTemplate;
  selected: boolean;
  onSelect: (template: PitchTemplate) => void;
}

export function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const { t } = useTranslation();
  const Icon = ICONS[template];

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40"
      )}
      aria-pressed={selected}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
        )}
      >
        <Icon size={20} />
      </div>
      <p className="font-semibold text-sm leading-tight">
        {t(`templates.${template}.name`)}
      </p>
      <p className="text-xs text-muted-foreground leading-snug">
        {t(`templates.${template}.description`)}
      </p>
      {selected && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
      )}
    </button>
  );
}
