import { useEffect } from "react";
import type { Theme } from "@/schemas/appSettings";

export function useTheme(theme: Theme): void {
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      return;
    }
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = ({ matches }: { matches: boolean }) => {
      document.documentElement.classList.toggle("dark", matches);
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}
