import { useState } from "react";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { HistoryList } from "@/features/history/components/HistoryList";
import { PitchResult } from "@/features/pitch-generator/components/PitchResult";
import { useHistory } from "@/features/history/hooks/useHistory";
import type { GeneratedPitch } from "@/types";

export function HistoryPage() {
  const { t } = useTranslation();
  const { pitches, savePitch, deletePitch } = useHistory();
  const [openPitch, setOpenPitch] = useState<GeneratedPitch | null>(null);

  if (openPitch) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          onClick={() => setOpenPitch(null)}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← {t("history.title")}
        </button>
        <Separator />
        <PitchResult
          pitch={openPitch}
          onSave={savePitch}
          onRegenerate={() => setOpenPitch(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <History size={20} className="text-primary" />
        <h1 className="text-2xl font-bold">{t("history.title")}</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {pitches.length} / 50
        </span>
      </div>
      <Separator />
      <HistoryList
        pitches={pitches}
        onDelete={deletePitch}
        onOpen={setOpenPitch}
      />
    </div>
  );
}
