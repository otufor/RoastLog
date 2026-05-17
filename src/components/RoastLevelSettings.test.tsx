import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RoastLevelSettings } from "@/components/RoastLevelSettings";
import { db } from "@/db";

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <RoastLevelSettings />
    </QueryClientProvider>,
  );
}

async function expand() {
  await userEvent.click(screen.getByRole("button", { name: "焙煎度を展開" }));
}

describe("RoastLevelSettings", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("デフォルトで折りたたまれており、リストと追加ボタンが非表示", () => {
    renderSection();
    expect(
      screen.queryByRole("button", { name: "焙煎度を追加" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "焙煎度を展開" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("展開ボタンをクリックするとコンテンツが表示される", async () => {
    renderSection();
    await expand();
    expect(
      screen.getByRole("button", { name: "焙煎度を追加" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "焙煎度を折りたたむ" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("展開後に再クリックすると折りたたまれる", async () => {
    renderSection();
    await expand();
    await userEvent.click(
      screen.getByRole("button", { name: "焙煎度を折りたたむ" }),
    );
    expect(
      screen.queryByRole("button", { name: "焙煎度を追加" }),
    ).not.toBeInTheDocument();
  });

  it("登録済み RoastLevel を order 順で表示する", async () => {
    await db.roastLevels.bulkAdd([
      { id: "a", label: "深煎り", color: "#3E1A06", order: 5 },
      { id: "b", label: "浅煎り", color: "#E8C84A", order: 1 },
    ]);

    renderSection();
    await expand();

    await waitFor(() => expect(screen.getByText("浅煎り")).toBeInTheDocument());
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("浅煎り")).toBeInTheDocument();
    expect(within(items[1]).getByText("深煎り")).toBeInTheDocument();
  });

  it("「追加」ボタンから新しい RoastLevel を作成できる", async () => {
    const user = userEvent.setup();
    renderSection();
    await expand();

    await user.click(screen.getByRole("button", { name: "焙煎度を追加" }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("ラベル"), "中煎り");
    await user.clear(within(dialog).getByLabelText("カラー (#hex)"));
    await user.type(within(dialog).getByLabelText("カラー (#hex)"), "#B06B1E");
    await user.clear(within(dialog).getByLabelText("並び順"));
    await user.type(within(dialog).getByLabelText("並び順"), "3");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    await waitFor(() => expect(screen.getByText("中煎り")).toBeInTheDocument());
  });

  it("「編集」ボタンで既存の RoastLevel を更新できる", async () => {
    await db.roastLevels.add({
      id: "e",
      label: "中煎り",
      color: "#B06B1E",
      order: 3,
    });

    const user = userEvent.setup();
    renderSection();
    await expand();
    await waitFor(() => expect(screen.getByText("中煎り")).toBeInTheDocument());

    const item = screen.getByRole("listitem");
    await user.click(within(item).getByRole("button", { name: "編集" }));

    const dialog = await screen.findByRole("dialog");
    const labelInput = within(dialog).getByLabelText("ラベル");
    await user.clear(labelInput);
    await user.type(labelInput, "中深煎り");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(screen.getByText("中深煎り")).toBeInTheDocument(),
    );
    expect(screen.queryByText("中煎り")).not.toBeInTheDocument();
  });

  it("ラベルが空の場合は保存されない", async () => {
    const user = userEvent.setup();
    renderSection();
    await expand();

    await user.click(screen.getByRole("button", { name: "焙煎度を追加" }));
    const dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText("ラベル"));
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(await db.roastLevels.count()).toBe(0);
  });

  it("「削除」ボタンで RoastLevel が消える", async () => {
    await db.roastLevels.add({
      id: "x",
      label: "中煎り",
      color: "#B06B1E",
      order: 3,
    });

    const user = userEvent.setup();
    renderSection();
    await expand();
    await waitFor(() => expect(screen.getByText("中煎り")).toBeInTheDocument());

    const item = screen.getByRole("listitem");
    await user.click(within(item).getByRole("button", { name: "削除" }));

    await waitFor(() =>
      expect(screen.queryByText("中煎り")).not.toBeInTheDocument(),
    );
  });
});
