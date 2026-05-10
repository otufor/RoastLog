import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BottomTabBar } from "@/components/BottomTabBar";

export const Route = createRootRoute({
  component: () => (
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
  ),
});
