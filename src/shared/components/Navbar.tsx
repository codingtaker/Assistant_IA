import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: t("nav.home"), icon: Sparkles },
    { to: "/history", label: t("nav.history"), icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <img src="favicon.svg" alt="StartupPitch AI" className="h-6 w-6" />
          <span className="hidden sm:inline">StartupPitch AI</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
