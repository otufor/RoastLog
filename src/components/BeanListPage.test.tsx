import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { BeanListPage } from "@/components/BeanListPage";
import { db } from "@/db";

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<BeanListPage />, { wrapper: makeWrapper(qc) });
}

describe("BeanListPage", () => {
  beforeEach(async () => {
    await db.beans.clear();
  });

  it("生豆が 0 件のとき空状態メッセージが表示される", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("生豆が登録されていません")).toBeInTheDocument(),
    );
  });

  it("ダイアログから生豆を登録すると一覧に表示される", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("生豆が登録されていません")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "生豆を追加" }));

    await user.type(screen.getByLabelText("名前"), "エチオピア イルガチェフェ");
    await user.type(screen.getByLabelText("在庫 (g)"), "500");

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
  });

  it("name が空のまま登録するとバリデーションエラーが表示される", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "生豆を追加" }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "生豆を追加" }));
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
