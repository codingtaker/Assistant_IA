import { useTranslation } from "react-i18next";
import { Github } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border/60 bg-background/80">
      <div className="container mx-auto flex flex-col items-center gap-4 px-20 py-6 sm:flex-row sm:justify-between">
        {/* Left — brand */}
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" aria-hidden className="h-6 w-6" />
          <span className="font-semibold text-foreground text-[20px]">StartupPitch AI</span>
        </div>

        {/* Center — tagline + copyright */}
        <div className="flex flex-col items-center text-center text-sm text-muted-foreground">
          <span>{t("footer.tagline")}</span>
          <span className="text-xs">&copy; {year}</span>
        </div>

        {/* Right — GitHub */}
        <a
          href="https://github.com/codingtaker/Assistant_IA"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <Github size={25} />
          <span className="text-[20px]">GitHub</span>
        </a>
      </div>
    </footer>
  );
}
