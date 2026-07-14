import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Trash2, ExternalLink, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { GeneratedPitch } from "@/types";

interface HistoryListProps {
  pitches: GeneratedPitch[];
  onDelete: (id: string) => void;
  onOpen: (pitch: GeneratedPitch) => void;
}

export function HistoryList({ pitches, onDelete, onOpen }: HistoryListProps) {
  const { t } = useTranslation();

  if (pitches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
        <History size={40} className="opacity-30" />
        <p className="text-sm">{t("history.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pitches.map((pitch, i) => (
        <div key={pitch.id}>
          <div className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold truncate">{pitch.projectName}</span>
                <Badge variant="secondary" className="capitalize text-xs">
                  {pitch.template.replace("-", " ")}
                </Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {pitch.provider}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(pitch.generatedAt), "PPP · p")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpen(pitch)}
                title={t("history.open")}
              >
                <ExternalLink size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(pitch.id)}
                title={t("history.delete")}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          {i < pitches.length - 1 && <Separator className="opacity-40" />}
        </div>
      ))}
    </div>
  );
}
