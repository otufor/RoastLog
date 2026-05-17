import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BottomTabBar } from "@/components/BottomTabBar";
import { useTheme } from "@/hooks/useTheme";

function RootComponent() {
  useTheme();
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
