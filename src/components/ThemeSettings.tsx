import { Monitor, Moon, Sun } from "lucide-react";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import type { Theme } from "@/schemas/appSettings";

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "システム",
    icon: <Monitor className="size-4" aria-hidden />,
  },
  {
    value: "light",
    label: "ライト",
    icon: <Sun className="size-4" aria-hidden />,
  },
  {
    value: "dark",
    label: "ダーク",
    icon: <Moon className="size-4" aria-hidden />,
  },
];

export function ThemeSettings() {
  const { data: settings, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();

  if (isLoading || !settings) return null;

  const current = settings.theme;

  return (
    <fieldset className="m-0 flex items-center justify-between gap-4 border-0 p-4">
      <legend className="float-left text-sm">カラーモード</legend>
      <div className="flex overflow-hidden rounded-md border border-border">
        {OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={current === value}
            onClick={() => update.mutate({ ...settings, theme: value })}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "not-first:border-l not-first:border-border",
              current === value
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
