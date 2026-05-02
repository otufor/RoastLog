import { render, screen, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BeanForm } from "@/components/BeanForm";
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
};

describe("BeanForm", () => {
  it("全フィールドを入力して送信できる", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BeanForm
        defaultValues={emptyDefaults}
        onSubmit={onSubmit}
        submitLabel="登録"
      />,
    );

    await user.type(screen.getByLabelText("名前"), "エチオピア イルガチェフェ");
    await user.type(screen.getByLabelText("産地"), "エチオピア");
    await user.type(screen.getByLabelText("製品名"), "G1 ナチュラル");
    await user.type(screen.getByLabelText("購入店"), "丸山珈琲");
    await user.type(screen.getByLabelText("購入日"), "2024-01-15");
    await user.type(screen.getByLabelText("輸入時期"), "2023-12-01");
    await user.clear(screen.getByLabelText("在庫 (g)"));
    await user.type(screen.getByLabelText("在庫 (g)"), "500");
    await user.type(screen.getByLabelText("メモ"), "test note");

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "エチオピア イルガチェフェ",
        origin: "エチオピア",
        productName: "G1 ナチュラル",
        shopName: "丸山珈琲",
        purchasedAt: "2024-01-15",
        importedAt: "2023-12-01",
        stockG: 500,
        note: "test note",
      });
    });
  });

  it("name が空のまま送信するとバリデーションエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BeanForm
        defaultValues={emptyDefaults}
        onSubmit={onSubmit}
        submitLabel="登録"
      />,
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("名前は必須です"),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("defaultValues を初期値として表示する", async () => {
    const onSubmit = vi.fn();
    render(
      <BeanForm
        defaultValues={{
          ...emptyDefaults,
          name: "ブラジル セラード",
          stockG: 250,
        }}
        onSubmit={onSubmit}
        submitLabel="保存"
      />,
    );
    expect(screen.getByLabelText<HTMLInputElement>("名前").value).toBe(
      "ブラジル セラード",
    );
    expect(screen.getByLabelText<HTMLInputElement>("在庫 (g)").value).toBe(
      "250",
    );
  });
});
