import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { t, i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language.startsWith("fr") ? "en" : "fr";
    i18n.changeLanguage(next);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="gap-1.5 text-xs">
      <Globe size={14} />
      {t("language")}
    </Button>
  );
}
