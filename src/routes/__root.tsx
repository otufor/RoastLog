import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BottomTabBar, TABS } from "@/components/BottomTabBar";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/hooks/useTheme";

type SwipePhase = "idle" | "dragging" | "exiting";

const SWIPE_THRESHOLD = 80;
const EXIT_DURATION = 250;
const RETURN_DURATION = 200;

export function RootComponent() {
  const { data: settings } = useAppSettings();
  useTheme(settings?.theme ?? "system");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [phase, setPhase] = useState<SwipePhase>("idle");
  const [offset, setOffset] = useState(0);
  const touchData = useRef<{ startX: number; startTime: number } | null>(null);
  const pendingNav = useRef<{ direction: -1 | 1 } | null>(null);

  const currentIdx = TABS.findIndex((tab) =>
    pathname.startsWith(tab.matchPrefix),
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (phase !== "idle") return;
      const t = e.touches[0];
      touchData.current = { startX: t.clientX, startTime: Date.now() };
      setPhase("dragging");
      setOffset(0);
    },
    [phase],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (phase !== "dragging" || !touchData.current) return;
      const t = e.touches[0];
      let dx = t.clientX - touchData.current.startX;

      const direction = dx < 0 ? 1 : dx > 0 ? -1 : 0;
      const nextIdx = currentIdx + direction;

      if (nextIdx < 0 || nextIdx >= TABS.length) {
        dx *= 0.3;
      }

      setOffset(dx);
    },
    [phase, currentIdx],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (phase !== "dragging" || !touchData.current) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - touchData.current.startX;
      const dt = Date.now() - touchData.current.startTime;
      const velocity = Math.abs(dx) / (dt || 1);

      const direction = dx < 0 ? 1 : dx > 0 ? -1 : 0;
      const nextIdx = currentIdx + direction;

      if (direction === 0 || nextIdx < 0 || nextIdx >= TABS.length) {
        setPhase("exiting");
        setOffset(0);
        setTimeout(() => {
          setPhase("idle");
          setOffset(0);
        }, RETURN_DURATION);
        return;
      }

      const shouldSwitch = Math.abs(dx) > SWIPE_THRESHOLD || velocity > 0.3;

      if (shouldSwitch) {
        pendingNav.current = { direction };
        setPhase("exiting");
        setOffset(direction * window.innerWidth);
        setTimeout(() => {
          navigate({ to: TABS[nextIdx].href });
          pendingNav.current = null;
          setPhase("idle");
          setOffset(0);
        }, EXIT_DURATION);
      } else {
        setPhase("exiting");
        setOffset(0);
        setTimeout(() => {
          setPhase("idle");
          setOffset(0);
        }, RETURN_DURATION);
      }
    },
    [phase, currentIdx, navigate],
  );

  useEffect(() => {
    if (pathname && phase === "idle") {
      setOffset(0);
    }
  }, [pathname, phase]);

  const transitionDuration =
    phase === "exiting"
      ? `${EXIT_DURATION}ms`
      : phase === "dragging"
        ? "0ms"
        : `${RETURN_DURATION}ms`;

  const transitionTiming =
    phase === "exiting" || phase === "idle"
      ? "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : undefined;

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
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${offset}px)`,
            transition: transitionTiming
              ? `transform ${transitionDuration} ${transitionTiming}`
              : `transform ${transitionDuration}`,
          }}
        >
          <Outlet />
        </div>
      </div>
      <BottomTabBar />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
