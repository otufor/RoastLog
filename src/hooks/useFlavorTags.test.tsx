import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react/pure";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  useCreateFlavorTag,
  useDeleteFlavorTag,
  useFlavorTags,
  useUpdateFlavorTag,
} from "@/hooks/useFlavorTags";

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("useFlavorTags", () => {
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
    const { result } = renderHook(() => useFlavorTags(), {
      wrapper: makeWrapper(makeQc()),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it("create / update / delete が一覧に反映される", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: list } = renderHook(() => useFlavorTags(), { wrapper });
    const { result: create } = renderHook(() => useCreateFlavorTag(), {
      wrapper,
    });
    const { result: update } = renderHook(() => useUpdateFlavorTag(), {
      wrapper,
    });
    const { result: del } = renderHook(() => useDeleteFlavorTag(), { wrapper });

    await waitFor(() => expect(list.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({ name: "ベリー", color: "#C4B5FD" });
    });
    await waitFor(() => expect(list.current.data).toHaveLength(1));

    const tag = list.current.data?.[0];
    if (!tag) throw new Error("tag not found");

    await act(async () => {
      update.current.mutate({ ...tag, name: "ブルーベリー" });
    });
    await waitFor(() =>
      expect(list.current.data?.[0].name).toBe("ブルーベリー"),
    );

    await act(async () => {
      del.current.mutate(tag.id);
    });
    await waitFor(() => expect(list.current.data).toHaveLength(0));
  });
});
