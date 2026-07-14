import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/shared/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

const CYCLE: Theme[] = ["system", "light", "dark"];

const ICONS: Record<Theme, React.ElementType> = {
  light:  Sun,
  dark:   Moon,
  system: Monitor,
};

const LABELS: Record<Theme, string> = {
  light:  "Light mode",
  dark:   "Dark mode",
  system: "System theme",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];
  const Icon = ICONS[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(next)}
      title={`${LABELS[theme]} — click to switch`}
      aria-label={LABELS[theme]}
    >
      <Icon size={16} />
    </Button>
  );
}
