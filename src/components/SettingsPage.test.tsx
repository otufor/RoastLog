import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react/pure";
import { beforeEach, describe, expect, it } from "vitest";
import { SettingsPage } from "@/components/SettingsPage";
import { db } from "@/db";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/settings",
    component: SettingsPage,
  });
  const beansRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans",
    component: () => <div data-testid="beans">beans</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([settingsRoute, beansRoute]),
    history: createMemoryHistory({ initialEntries: ["/settings"] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("SettingsPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("3 つのマスター管理セクションを表示する", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "焙煎度", level: 2 }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "フレーバータグ", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "焙煎機", level: 2 }),
    ).toBeInTheDocument();
  });
});
