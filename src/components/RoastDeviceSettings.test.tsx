import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RoastDeviceSettings } from "@/components/RoastDeviceSettings";
import { db } from "@/db";

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <RoastDeviceSettings />
    </QueryClientProvider>,
  );
}

describe("RoastDeviceSettings", () => {
  beforeEach(async () => {
    await db.roastDevices.clear();
  });

  it("登録済み RoastDevice を一覧表示する", async () => {
    await db.roastDevices.add({
      id: "a",
      name: "weroast HOME ROASTER",
      method: "熱風式",
      note: "",
    });
    renderSection();
    await waitFor(() =>
      expect(screen.getByText("weroast HOME ROASTER")).toBeInTheDocument(),
    );
  });

  it("「追加」ボタンから新規作成できる", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole("button", { name: "焙煎機を追加" }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("名前"), "Aillio Bullet");
    await user.type(within(dialog).getByLabelText("方式"), "ドラム式");
    await user.type(within(dialog).getByLabelText("メモ"), "1kg バッチ");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(screen.getByText("Aillio Bullet")).toBeInTheDocument(),
    );
  });

  it("「編集」ボタンで既存の RoastDevice を更新できる", async () => {
    await db.roastDevices.add({
      id: "e",
      name: "weroast HOME ROASTER",
      method: "熱風式",
      note: "",
    });

    const user = userEvent.setup();
    renderSection();
    await waitFor(() =>
      expect(screen.getByText("weroast HOME ROASTER")).toBeInTheDocument(),
    );

    const item = screen.getByRole("listitem");
    await user.click(within(item).getByRole("button", { name: "編集" }));

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText("名前");
    await user.clear(nameInput);
    await user.type(nameInput, "Aillio Bullet R1");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(screen.getByText("Aillio Bullet R1")).toBeInTheDocument(),
    );
    expect(screen.queryByText("weroast HOME ROASTER")).not.toBeInTheDocument();
  });

  it("名前が空の場合は保存されない", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole("button", { name: "焙煎機を追加" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(await db.roastDevices.count()).toBe(0);
  });

  it("「削除」ボタンで消える", async () => {
    await db.roastDevices.add({
      id: "x",
      name: "Behmor 2000AB",
      method: "熱風式",
      note: "",
    });

    const user = userEvent.setup();
    renderSection();
    await waitFor(() =>
      expect(screen.getByText("Behmor 2000AB")).toBeInTheDocument(),
    );

    const item = screen.getByRole("listitem");
    await user.click(within(item).getByRole("button", { name: "削除" }));

    await waitFor(() =>
      expect(screen.queryByText("Behmor 2000AB")).not.toBeInTheDocument(),
    );
  });
});
