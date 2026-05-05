import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BeanForm } from "@/components/BeanForm";
import { db } from "@/db";
import type { CreateBeanInput } from "@/schemas/bean";

const emptyDefaults: CreateBeanInput = {
  name: "",
  origin: "",
  productName: "",
  shopName: "",
  purchasedAt: null,
  importedAt: null,
  stockG: 0,
  note: "",
  totalG: 0,
  flavorTagIds: [],
  process: "",
  region: "",
  altitude: "",
  variety: "",
};

function renderForm(props: Partial<Parameters<typeof BeanForm>[0]> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <BeanForm
        defaultValues={emptyDefaults}
        onSubmit={() => {}}
        submitLabel="登録"
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("BeanForm", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("名前・産地・在庫を入力して送信できる", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText("名前"), "エチオピア イルガチェフェ");
    await user.type(screen.getByLabelText("産地"), "エチオピア");
    await user.clear(screen.getByLabelText("在庫 (g)"));
    await user.type(screen.getByLabelText("在庫 (g)"), "500");

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "エチオピア イルガチェフェ",
          origin: "エチオピア",
          stockG: 500,
        }),
      );
    });
  });

  it("name が空のまま送信するとバリデーションエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("名前は必須です"),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("defaultValues を初期値として表示する", async () => {
    renderForm({
      defaultValues: {
        ...emptyDefaults,
        name: "ブラジル セラード",
        stockG: 250,
        region: "セラード",
      },
    });
    expect(screen.getByLabelText<HTMLInputElement>("名前").value).toBe(
      "ブラジル セラード",
    );
    expect(screen.getByLabelText<HTMLInputElement>("在庫 (g)").value).toBe(
      "250",
    );
    expect(screen.getByLabelText<HTMLInputElement>("地域").value).toBe(
      "セラード",
    );
  });

  it("精製方法トグルで process が変わる", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText("名前"), "テスト豆");
    await user.click(screen.getByRole("button", { name: "Natural" }));
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ process: "Natural" }),
      );
    });
  });

  it("フレーバータグがDBにあれば選択できる", async () => {
    await db.flavorTags.put({
      id: "floral",
      name: "フローラル",
      color: "#F9A8D4",
    });

    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /フローラル/ }),
      ).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText("名前"), "テスト豆");
    await user.click(screen.getByRole("button", { name: /フローラル/ }));
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ flavorTagIds: ["floral"] }),
      );
    });
  });
});
