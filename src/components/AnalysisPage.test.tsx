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
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AnalysisPage } from "@/components/AnalysisPage";
import { db } from "@/db";
import type { Bean } from "@/schemas/bean";
import type { RoastLog, Tasting } from "@/schemas/roastLog";

const TASTING: Tasting = {
  flavorTags: [],
  sweetness: 4,
  acidity: 3,
  body: 3,
  bitterness: 2,
  aftertaste: 4,
  cleanliness: 5,
};

const BEAN: Bean = {
  id: crypto.randomUUID(),
  name: "エチオピア",
  origin: "エチオピア",
  productName: "",
  shopName: "",
  purchasedAt: null,
  importedAt: null,
  stockG: 500,
  bestLogId: null,
  note: "",
  totalG: 0,
  flavorTagIds: [],
  process: "",
  region: "",
  altitude: "",
  variety: "",
};

const makeLog = (overrides: Partial<RoastLog> = {}): RoastLog => ({
  id: crypto.randomUUID(),
  beanId: BEAN.id,
  roastDate: "2025-01-01",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: null,
  outdoorHumidity: null,
  indoorTempC: null,
  tempSource: "auto",
  weatherCode: null,
  tasting: null,
  overallScore: null,
  processNote: "",
  ...overrides,
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: "/analysis",
    component: AnalysisPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/analysis"] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("AnalysisPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("豆セレクターが表示される", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
  });

  it("豆未選択時、折れ線グラフが表示されない", async () => {
    await db.beans.put(BEAN);
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
  });

  it("BestRecipe 未設定時、レーダーのプレースホルダーが表示される", async () => {
    await db.beans.put(BEAN);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/BestRecipe/)).toBeInTheDocument(),
    );
  });

  it("Tasting なしのログは重ね表示の選択肢から除外される", async () => {
    const logWithTasting = makeLog({
      tasting: TASTING,
      roastDate: "2025-01-01",
    });
    const logWithout = makeLog({ tasting: null, roastDate: "2025-02-01" });
    await db.beans.put({ ...BEAN, bestLogId: logWithTasting.id });
    await db.beans.put(BEAN);
    await db.roastLogs.put(logWithTasting);
    await db.roastLogs.put(logWithout);
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: /重ね表示/ }),
      ).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox", { name: /重ね表示/ }));

    await waitFor(() => {
      expect(screen.getByText("2025-01-01")).toBeInTheDocument();
      expect(screen.queryByText("2025-02-01")).not.toBeInTheDocument();
    });
  });
});
