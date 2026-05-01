import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react/pure";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { useCreateBean, useDeleteBean, useUpdateBean } from "@/hooks/useMutateBean";
import { useBeans } from "@/hooks/useBeans";

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("useBeans", () => {
  beforeEach(async () => {
    await db.beans.clear();
  });

  it("初期状態では空配列を返す", async () => {
    const { result } = renderHook(() => useBeans(), {
      wrapper: makeWrapper(makeQc()),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it("useCreateBean で保存すると useBeans に現れる", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: beans } = renderHook(() => useBeans(), { wrapper });
    const { result: create } = renderHook(() => useCreateBean(), { wrapper });

    await waitFor(() => expect(beans.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({
        name: "エチオピア イルガチェフェ",
        origin: "エチオピア",
        productName: "イルガチェフェ G1",
        shopName: "テストショップ",
        purchasedAt: null,
        importedAt: null,
        stockG: 500,
        note: "",
      });
    });

    await waitFor(() => expect(beans.current.data).toHaveLength(1));
    expect(beans.current.data![0].name).toBe("エチオピア イルガチェフェ");
  });

  it("useDeleteBean で削除すると useBeans から消える", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: beans } = renderHook(() => useBeans(), { wrapper });
    const { result: create } = renderHook(() => useCreateBean(), { wrapper });
    const { result: del } = renderHook(() => useDeleteBean(), { wrapper });

    await waitFor(() => expect(beans.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({
        name: "コロンビア",
        origin: "コロンビア",
        productName: "",
        shopName: "",
        purchasedAt: null,
        importedAt: null,
        stockG: 300,
        note: "",
      });
    });
    await waitFor(() => expect(beans.current.data).toHaveLength(1));

    const id = beans.current.data![0].id;
    await act(async () => { del.current.mutate(id); });
    await waitFor(() => expect(beans.current.data).toHaveLength(0));
  });

  it("useUpdateBean で変更が useBeans に反映される", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: beans } = renderHook(() => useBeans(), { wrapper });
    const { result: create } = renderHook(() => useCreateBean(), { wrapper });
    const { result: update } = renderHook(() => useUpdateBean(), { wrapper });

    await waitFor(() => expect(beans.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({
        name: "ブラジル",
        origin: "ブラジル",
        productName: "",
        shopName: "",
        purchasedAt: null,
        importedAt: null,
        stockG: 200,
        note: "",
      });
    });
    await waitFor(() => expect(beans.current.data).toHaveLength(1));

    const bean = beans.current.data![0];
    await act(async () => {
      update.current.mutate({ ...bean, name: "ブラジル セラード", stockG: 150 });
    });

    await waitFor(() => expect(beans.current.data![0].name).toBe("ブラジル セラード"));
    expect(beans.current.data![0].stockG).toBe(150);
  });
});
