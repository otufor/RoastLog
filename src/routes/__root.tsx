import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BottomTabBar } from "@/components/BottomTabBar";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/hooks/useTheme";

function RootComponent() {
  const { data: settings } = useAppSettings();
  useTheme(settings?.theme ?? "system");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
