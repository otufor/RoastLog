import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react/pure";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  useCreateRoastLevel,
  useDeleteRoastLevel,
  useRoastLevels,
  useUpdateRoastLevel,
} from "@/hooks/useRoastLevels";

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("useRoastLevels", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("初期状態では空配列を返す", async () => {
    const { result } = renderHook(() => useRoastLevels(), {
      wrapper: makeWrapper(makeQc()),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it("create したものが order 順で取得できる", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: list } = renderHook(() => useRoastLevels(), { wrapper });
    const { result: create } = renderHook(() => useCreateRoastLevel(), {
      wrapper,
    });

    await waitFor(() => expect(list.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({ label: "中煎り", color: "#B06B1E", order: 3 });
    });
    await act(async () => {
      create.current.mutate({ label: "浅煎り", color: "#E8C84A", order: 1 });
    });

    await waitFor(() => expect(list.current.data).toHaveLength(2));
    expect(list.current.data?.map((l) => l.label)).toEqual([
      "浅煎り",
      "中煎り",
    ]);
  });

  it("update で値を変えられる", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: list } = renderHook(() => useRoastLevels(), { wrapper });
    const { result: create } = renderHook(() => useCreateRoastLevel(), {
      wrapper,
    });
    const { result: update } = renderHook(() => useUpdateRoastLevel(), {
      wrapper,
    });

    await waitFor(() => expect(list.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({ label: "深煎り", color: "#3E1A06", order: 5 });
    });
    await waitFor(() => expect(list.current.data).toHaveLength(1));

    const level = list.current.data?.[0];
    if (!level) throw new Error("level not found");

    await act(async () => {
      update.current.mutate({ ...level, label: "イタリアン" });
    });
    await waitFor(() =>
      expect(list.current.data?.[0].label).toBe("イタリアン"),
    );
  });

  it("delete で削除できる", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: list } = renderHook(() => useRoastLevels(), { wrapper });
    const { result: create } = renderHook(() => useCreateRoastLevel(), {
      wrapper,
    });
    const { result: del } = renderHook(() => useDeleteRoastLevel(), {
      wrapper,
    });

    await waitFor(() => expect(list.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({ label: "中煎り", color: "#B06B1E", order: 3 });
    });
    await waitFor(() => expect(list.current.data).toHaveLength(1));
    const id = list.current.data?.[0].id ?? "";

    await act(async () => {
      del.current.mutate(id);
    });
    await waitFor(() => expect(list.current.data).toHaveLength(0));
  });
});
