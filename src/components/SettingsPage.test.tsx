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
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "@/components/SettingsPage";
import { db } from "@/db";
import { roastLogsToCSV } from "@/lib/csvExport";
import type { RoastLog } from "@/schemas/roastLog";

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

  it("「位置情報」セクションが「焙煎度ラベル」セクションより前に表示される", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "位置情報" }),
      ).toBeInTheDocument();
    });
    const headings = screen.getAllByRole("heading", { level: 2 });
    const labels = headings.map((h) => h.textContent);
    expect(labels.indexOf("位置情報")).toBeLessThan(
      labels.indexOf("焙煎度ラベル"),
    );
  });

  it("5つのセクション見出しが正しい順序で表示される", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "位置情報", level: 2 }),
      ).toBeInTheDocument();
    });
    const headings = screen.getAllByRole("heading", { level: 2 });
    const labels = headings.map((h) => h.textContent);
    const order = [
      "位置情報",
      "焙煎度ラベル",
      "フレーバータグ",
      "焙煎機",
      "データ管理",
    ];
    const indices = order.map((label) => labels.indexOf(label));
    for (const [i, idx] of indices.entries()) {
      expect(idx, `${order[i]} が見つからない`).toBeGreaterThanOrEqual(0);
    }
    for (let i = 0; i < indices.length - 1; i++) {
      expect(
        indices[i],
        `${order[i]} は ${order[i + 1]} より前に表示される必要がある`,
      ).toBeLessThan(indices[i + 1]);
    }
  });

  it("3 つのマスター管理セクションを表示する", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "焙煎度ラベル", level: 2 }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "フレーバータグ", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "焙煎機", level: 2 }),
    ).toBeInTheDocument();
  });

  it("エクスポートボタンとインポート UI が表示される", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /CSV エクスポート/ }),
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/CSV ファイル/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /上書き/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /スキップ/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /インポート/ }),
    ).toBeInTheDocument();
  });

  it("エクスポートボタンクリックで downloadCSV が呼ばれる", async () => {
    const mockCreateObjectURL = vi.fn(() => "blob:mock");
    const mockRevokeObjectURL = vi.fn();
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    const sampleLog: RoastLog = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      beanId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      roastDate: "2024-01-15",
      roastLevelId: "medium",
      roastDeviceId: null,
      roastDurationSec: 720,
      firstCrackSec: null,
      secondCrackSec: null,
      weightBeforeG: 200,
      weightAfterG: 170,
      outdoorTempC: null,
      outdoorHumidity: null,
      indoorTempC: null,
      tempSource: "manual",
      weatherCode: null,
      tasting: null,
      overallScore: null,
      processNote: "",
    };
    await db.roastLogs.put(sampleLog);

    renderPage();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /CSV エクスポート/ }),
      ).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByRole("button", { name: /CSV エクスポート/ }),
    );

    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledOnce());
    expect(mockRevokeObjectURL).toHaveBeenCalledOnce();
  });

  it("不正な CSV をインポートするとエラーメッセージが表示される", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/CSV ファイル/)).toBeInTheDocument(),
    );

    const file = new File(["不正,なCSV\n行1,行2"], "bad.csv", {
      type: "text/csv",
    });
    await userEvent.upload(screen.getByLabelText(/CSV ファイル/), file);
    await userEvent.click(screen.getByRole("button", { name: /インポート/ }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert").textContent).toMatch(/ヘッダー/);
  });

  it("正常な CSV をインポートすると RoastLog が保存される", async () => {
    const sampleLog: RoastLog = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      beanId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      roastDate: "2024-01-15",
      roastLevelId: "medium",
      roastDeviceId: null,
      roastDurationSec: 720,
      firstCrackSec: null,
      secondCrackSec: null,
      weightBeforeG: 200,
      weightAfterG: 170,
      outdoorTempC: null,
      outdoorHumidity: null,
      indoorTempC: null,
      tempSource: "manual",
      weatherCode: null,
      tasting: null,
      overallScore: null,
      processNote: "",
    };
    const csv = roastLogsToCSV([sampleLog]);
    const file = new File([csv], "roastlogs.csv", { type: "text/csv" });

    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/CSV ファイル/)).toBeInTheDocument(),
    );

    await userEvent.upload(screen.getByLabelText(/CSV ファイル/), file);
    await userEvent.click(screen.getByRole("button", { name: /インポート/ }));

    await waitFor(async () => {
      const saved = await db.roastLogs.get(sampleLog.id);
      expect(saved).toBeDefined();
    });
  });
});
