import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  Copy,
  CheckCheck,
  FileText,
  FileJson,
  Download,
  Bookmark,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { GeneratedPitch } from "@/types";

interface PitchResultProps {
  pitch: GeneratedPitch;
  onSave: (pitch: GeneratedPitch) => void;
  onRegenerate: () => void;
}

export function PitchResult({ pitch, onSave, onRegenerate }: PitchResultProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const fullText = pitch.sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pitch.projectName}-${pitch.template}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(pitch.projectName, margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Template: ${pitch.template} | Model: ${pitch.model}`, margin, y);
    y += 12;

    for (const section of pitch.sections) {
      if (y > 260) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30);
      doc.text(section.title, margin, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const lines = doc.splitTextToSize(section.content, pageWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 10;
    }

    doc.save(`${pitch.projectName}-${pitch.template}.pdf`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(pitch, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pitch.projectName}-${pitch.template}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSave(pitch);
    setSaved(true);
    toast.success(t("result.saved"));
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{pitch.projectName}</h2>
          <Badge variant="secondary" className="capitalize">
            {pitch.template.replace("-", " ")}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {t("result.generatedBy", { model: pitch.model })}
          </Badge>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <><CheckCheck className="mr-1.5 h-3.5 w-3.5" />{t("result.copied")}</>
            ) : (
              <><Copy className="mr-1.5 h-3.5 w-3.5" />{t("result.copy")}</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportTxt}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {t("result.exportTxt")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t("result.exportPdf")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <FileJson className="mr-1.5 h-3.5 w-3.5" />
            {t("result.exportJson")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saved}
          >
            <Bookmark className="mr-1.5 h-3.5 w-3.5" />
            {saved ? t("result.saved") : t("result.save")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onRegenerate}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t("result.regenerate")}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Sections */}
      <div className="space-y-6">
        {pitch.sections.map((section, i) => (
          <div key={i} className="space-y-2">
            <h3 className="font-semibold text-primary">{section.title}</h3>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {section.content}
            </p>
            {i < pitch.sections.length - 1 && (
              <Separator className="mt-4 opacity-40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
