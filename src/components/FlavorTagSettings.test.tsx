import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { FlavorTagSettings } from "@/components/FlavorTagSettings";
import { db } from "@/db";

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <FlavorTagSettings />
    </QueryClientProvider>,
  );
}

async function expand() {
  await userEvent.click(
    screen.getByRole("button", { name: "フレーバータグを展開" }),
  );
}

describe("FlavorTagSettings", () => {
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
      screen.queryByRole("button", { name: "フレーバータグを追加" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "フレーバータグを展開" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("展開ボタンをクリックするとコンテンツが表示される", async () => {
    renderSection();
    await expand();
    expect(
      screen.getByRole("button", { name: "フレーバータグを追加" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "フレーバータグを折りたたむ" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("展開後に再クリックすると折りたたまれる", async () => {
    renderSection();
    await expand();
    await userEvent.click(
      screen.getByRole("button", { name: "フレーバータグを折りたたむ" }),
    );
    expect(
      screen.queryByRole("button", { name: "フレーバータグを追加" }),
    ).not.toBeInTheDocument();
  });

  it("登録済み FlavorTag を一覧表示する", async () => {
    await db.flavorTags.add({
      id: "a",
      name: "フローラル",
      color: "#F9A8D4",
    });
    renderSection();
    await expand();
    await waitFor(() =>
      expect(screen.getByText("フローラル")).toBeInTheDocument(),
    );
  });

  it("「追加」ボタンから新規作成できる", async () => {
    const user = userEvent.setup();
    renderSection();
    await expand();

    await user.click(
      screen.getByRole("button", { name: "フレーバータグを追加" }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("名前"), "ベリー");
    await user.clear(within(dialog).getByLabelText("カラー (#hex)"));
    await user.type(within(dialog).getByLabelText("カラー (#hex)"), "#C4B5FD");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    await waitFor(() => expect(screen.getByText("ベリー")).toBeInTheDocument());
  });

  it("「編集」ボタンで既存の FlavorTag を更新できる", async () => {
    await db.flavorTags.add({ id: "e", name: "フローラル", color: "#F9A8D4" });

    const user = userEvent.setup();
    renderSection();
    await expand();
    await waitFor(() =>
      expect(screen.getByText("フローラル")).toBeInTheDocument(),
    );

    const item = screen.getByRole("listitem");
    await user.click(within(item).getByRole("button", { name: "編集" }));

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText("名前");
    await user.clear(nameInput);
    await user.type(nameInput, "シトラス");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(screen.getByText("シトラス")).toBeInTheDocument(),
    );
    expect(screen.queryByText("フローラル")).not.toBeInTheDocument();
  });

  it("名前が空の場合は保存されない", async () => {
    const user = userEvent.setup();
    renderSection();
    await expand();

    await user.click(
      screen.getByRole("button", { name: "フレーバータグを追加" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(await db.flavorTags.count()).toBe(0);
  });

  it("「削除」ボタンで消える", async () => {
    await db.flavorTags.add({
      id: "x",
      name: "ナッツ",
      color: "#D4B483",
    });

    const user = userEvent.setup();
    renderSection();
    await expand();
    await waitFor(() => expect(screen.getByText("ナッツ")).toBeInTheDocument());

    const item = screen.getByRole("listitem");
    await user.click(within(item).getByRole("button", { name: "削除" }));

    await waitFor(() =>
      expect(screen.queryByText("ナッツ")).not.toBeInTheDocument(),
    );
  });
});
