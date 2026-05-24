import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useRef } from "react";
import { BottomTabBar, TABS } from "@/components/BottomTabBar";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/hooks/useTheme";

function RootComponent() {
  const { data: settings } = useAppSettings();
  useTheme(settings?.theme ?? "system");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    const currentIdx = TABS.findIndex((tab) => pathname === tab.matchPrefix);
    if (currentIdx === -1) return;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= 2 * Math.abs(dy)) return;

    if (dx < 0 && currentIdx < TABS.length - 1) {
      navigate({ to: TABS[currentIdx + 1].href });
    } else if (dx > 0 && currentIdx > 0) {
      navigate({ to: TABS[currentIdx - 1].href });
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <div
        style={{ flex: 1, overflow: "auto", position: "relative" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
