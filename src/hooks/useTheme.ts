import { useEffect } from "react";

export function useTheme(): void {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = ({ matches }: { matches: boolean }) => {
      document.documentElement.classList.toggle("dark", matches);
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
}
