import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react/pure";
import { beforeEach, describe, expect, it } from "vitest";
import { LocationSettings } from "@/components/LocationSettings";
import { db } from "@/db";

const STORAGE_KEY = "roastlog.appSettings";

function renderComponent() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <LocationSettings />
    </QueryClientProvider>,
  );
}

describe("LocationSettings", () => {
  beforeEach(async () => {
    localStorage.clear();
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  describe("位置情報が設定済みのとき", () => {
    beforeEach(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          locationLat: 36.0652,
          locationLon: 136.2217,
          locationLabel: "自宅（福井）",
        }),
      );
    });

    it("座標が mono フォントで表示される", async () => {
      renderComponent();
      await waitFor(() => {
        const coord = screen.getByText(/36\.0652.*136\.2217/);
        expect(coord).toBeInTheDocument();
        expect(coord.className).toMatch(/font-mono/);
      });
    });

    it("「再取得」ボタンが表示される", async () => {
      renderComponent();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "再取得" }),
        ).toBeInTheDocument();
      });
    });

    it("場所ラベルが表示される", async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText("自宅（福井）")).toBeInTheDocument();
      });
    });
  });

  describe("位置情報が未設定のとき", () => {
    it("「位置情報が設定されていません」が表示される", async () => {
      renderComponent();
      await waitFor(() => {
        expect(
          screen.getByText("位置情報が設定されていません"),
        ).toBeInTheDocument();
      });
    });

    it("「位置情報を取得する」ボタンが表示される", async () => {
      renderComponent();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "位置情報を取得する" }),
        ).toBeInTheDocument();
      });
    });
  });
});
