import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react/pure";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  useCreateRoastLog,
  useDeleteRoastLog,
  useUpdateRoastLog,
} from "@/hooks/useMutateRoastLog";
import { usePreviousRoastLog, useRoastLogs } from "@/hooks/useRoastLogs";

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const BASE_INPUT = {
  beanId: "550e8400-e29b-41d4-a716-446655440001",
  roastDate: "2025-04-20",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: 18,
  outdoorHumidity: 60,
  indoorTempC: 22,
  tempSource: "auto" as const,
  weatherCode: 0,
  tasting: null,
  overallScore: null,
  processNote: "",
};

describe("useRoastLogs", () => {
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
    const { result } = renderHook(() => useRoastLogs(), {
      wrapper: makeWrapper(makeQc()),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it("useCreateRoastLog で保存すると useRoastLogs に現れる", async () => {
    await db.beans.put({
      id: BASE_INPUT.beanId,
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 500,
      bestLogId: null,
      note: "",
      totalG: 0,
      flavorTagIds: [],
      process: "",
      region: "",
      altitude: "",
      variety: "",
    });

    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: logs } = renderHook(() => useRoastLogs(), { wrapper });
    const { result: create } = renderHook(() => useCreateRoastLog(), {
      wrapper,
    });

    await waitFor(() => expect(logs.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate(BASE_INPUT);
    });

    await waitFor(() => expect(logs.current.data).toHaveLength(1));
    expect(logs.current.data?.[0].weightBeforeG).toBe(250);
  });

  it("useCreateRoastLog は Bean の在庫を weightBeforeG だけデクリメントする", async () => {
    await db.beans.put({
      id: BASE_INPUT.beanId,
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 500,
      bestLogId: null,
      note: "",
      totalG: 0,
      flavorTagIds: [],
      process: "",
      region: "",
      altitude: "",
      variety: "",
    });

    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: create } = renderHook(() => useCreateRoastLog(), {
      wrapper,
    });

    await act(async () => {
      create.current.mutate(BASE_INPUT);
    });
    await waitFor(() => expect(create.current.isSuccess).toBe(true));

    const bean = await db.beans.get(BASE_INPUT.beanId);
    expect(bean?.stockG).toBe(250); // 500 - 250
  });

  it("useDeleteRoastLog で削除すると useRoastLogs から消える", async () => {
    await db.beans.put({
      id: BASE_INPUT.beanId,
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 500,
      bestLogId: null,
      note: "",
      totalG: 0,
      flavorTagIds: [],
      process: "",
      region: "",
      altitude: "",
      variety: "",
    });

    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: logs } = renderHook(() => useRoastLogs(), { wrapper });
    const { result: create } = renderHook(() => useCreateRoastLog(), {
      wrapper,
    });
    const { result: del } = renderHook(() => useDeleteRoastLog(), { wrapper });

    await waitFor(() => expect(logs.current.isLoading).toBe(false));

    await act(async () => {
      create.current.mutate(BASE_INPUT);
    });
    await waitFor(() => expect(logs.current.data).toHaveLength(1));

    const logId = logs.current.data?.[0]?.id ?? "";
    expect(logId).not.toBe("");
    await act(async () => {
      del.current.mutate(logId);
    });
    await waitFor(() => expect(logs.current.data).toHaveLength(0));
  });

  it("useDeleteRoastLog では Bean.stockG が変化しない", async () => {
    await db.beans.put({
      id: BASE_INPUT.beanId,
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 500,
      bestLogId: null,
      note: "",
      totalG: 0,
      flavorTagIds: [],
      process: "",
      region: "",
      altitude: "",
      variety: "",
    });

    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: create } = renderHook(() => useCreateRoastLog(), {
      wrapper,
    });
    const { result: del } = renderHook(() => useDeleteRoastLog(), { wrapper });

    await act(async () => {
      create.current.mutate(BASE_INPUT);
    });
    await waitFor(() => expect(create.current.isSuccess).toBe(true));

    const logId = create.current.data?.id ?? "";
    const stockAfterCreate =
      (await db.beans.get(BASE_INPUT.beanId))?.stockG ?? 0;

    await act(async () => {
      del.current.mutate(logId);
    });
    await waitFor(() => expect(del.current.isSuccess).toBe(true));

    const bean = await db.beans.get(BASE_INPUT.beanId);
    expect(bean?.stockG).toBe(stockAfterCreate);
  });

  it("useUpdateRoastLog では Bean.stockG が変化しない", async () => {
    await db.beans.put({
      id: BASE_INPUT.beanId,
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 500,
      bestLogId: null,
      note: "",
      totalG: 0,
      flavorTagIds: [],
      process: "",
      region: "",
      altitude: "",
      variety: "",
    });

    const qc = makeQc();
    const wrapper = makeWrapper(qc);
    const { result: create } = renderHook(() => useCreateRoastLog(), {
      wrapper,
    });
    const { result: update } = renderHook(() => useUpdateRoastLog(), {
      wrapper,
    });

    await act(async () => {
      create.current.mutate(BASE_INPUT);
    });
    await waitFor(() => expect(create.current.isSuccess).toBe(true));

    const log = create.current.data;
    if (!log) throw new Error("create.current.data is undefined");
    const stockAfterCreate =
      (await db.beans.get(BASE_INPUT.beanId))?.stockG ?? 0;

    await act(async () => {
      update.current.mutate({ ...log, weightBeforeG: 999 });
    });
    await waitFor(() => expect(update.current.isSuccess).toBe(true));

    const bean = await db.beans.get(BASE_INPUT.beanId);
    expect(bean?.stockG).toBe(stockAfterCreate);
  });
});

const BEAN_ID = "550e8400-e29b-41d4-a716-446655440001";

const LOG_A: Parameters<typeof db.roastLogs.put>[0] = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  beanId: BEAN_ID,
  roastDate: "2025-04-20",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: 18,
  outdoorHumidity: 60,
  indoorTempC: 22,
  tempSource: "auto",
  weatherCode: 0,
  tasting: null,
  overallScore: 4,
  processNote: "",
};

const LOG_B: Parameters<typeof db.roastLogs.put>[0] = {
  ...LOG_A,
  id: "550e8400-e29b-41d4-a716-446655440011",
  roastDate: "2025-04-10",
};

const LOG_C: Parameters<typeof db.roastLogs.put>[0] = {
  ...LOG_A,
  id: "550e8400-e29b-41d4-a716-446655440012",
  roastDate: "2025-03-01",
};

describe("usePreviousRoastLog", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("直前のログ（roastDate 降順で1件前）を返す", async () => {
    await db.roastLogs.bulkPut([LOG_A, LOG_B, LOG_C]);

    const qc = makeQc();
    const { result } = renderHook(
      () => usePreviousRoastLog(LOG_A.id, BEAN_ID),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.id).toBe(LOG_B.id);
  });

  it("最初のログ（直前ログなし）では null を返す", async () => {
    await db.roastLogs.bulkPut([LOG_A, LOG_B, LOG_C]);

    const qc = makeQc();
    const { result } = renderHook(
      () => usePreviousRoastLog(LOG_C.id, BEAN_ID),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it("beanId が null のとき undefined を返しクエリを実行しない", async () => {
    const qc = makeQc();
    const { result } = renderHook(() => usePreviousRoastLog(LOG_A.id, null), {
      wrapper: makeWrapper(qc),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeUndefined();
  });
});
