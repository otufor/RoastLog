import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react/pure";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  useCreateRoastDevice,
  useDeleteRoastDevice,
  useRoastDevices,
  useUpdateRoastDevice,
} from "@/hooks/useRoastDevices";

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("useRoastDevices", () => {
  beforeEach(async () => {
    await db.roastDevices.clear();
  });

  it("初期状態では空配列を返す", async () => {
    const { result } = renderHook(() => useRoastDevices(), {
      wrapper: makeWrapper(makeQc()),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it("create / update / delete が一覧に反映される", async () => {
    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: list } = renderHook(() => useRoastDevices(), { wrapper });
    const { result: create } = renderHook(() => useCreateRoastDevice(), {
      wrapper,
    });
    const { result: update } = renderHook(() => useUpdateRoastDevice(), {
      wrapper,
    });
    const { result: del } = renderHook(() => useDeleteRoastDevice(), {
      wrapper,
    });

    await waitFor(() => expect(list.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate({
        name: "Aillio Bullet",
        method: "ドラム式",
        note: "",
      });
    });
    await waitFor(() => expect(list.current.data).toHaveLength(1));

    const device = list.current.data?.[0];
    if (!device) throw new Error("device not found");

    await act(async () => {
      update.current.mutate({ ...device, note: "1kg バッチ用" });
    });
    await waitFor(() =>
      expect(list.current.data?.[0].note).toBe("1kg バッチ用"),
    );

    await act(async () => {
      del.current.mutate(device.id);
    });
    await waitFor(() => expect(list.current.data).toHaveLength(0));
  });
});
