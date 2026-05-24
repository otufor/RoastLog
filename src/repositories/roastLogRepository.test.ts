import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RoastLogRepository } from "@/repositories/roastLogRepository";
import type { RoastLog } from "@/schemas/roastLog";

let db: Dexie;
let repo: RoastLogRepository;

beforeEach(() => {
  db = new Dexie(`roastlog-test-${crypto.randomUUID()}`);
  db.version(1).stores({ roastLogs: "id, beanId, roastStartTime" });
  repo = new RoastLogRepository(db.table("roastLogs"));
});

afterEach(async () => {
  await db.close();
  await Dexie.delete(db.name);
});

const BEAN_ID_A = "550e8400-e29b-41d4-a716-446655440001";
const BEAN_ID_B = "550e8400-e29b-41d4-a716-446655440002";

const makeLog = (overrides: Partial<RoastLog> = {}): RoastLog => ({
  id: crypto.randomUUID(),
  beanId: BEAN_ID_A,
  roastStartTime: "2024-03-20T00:00",
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
  overallScore: null,
  processNote: "",
  ...overrides,
});

describe("RoastLogRepository", () => {
  it("save した RoastLog を findById で取得できる", async () => {
    const log = makeLog();
    await repo.save(log);
    expect(await repo.findById(log.id)).toEqual(log);
  });

  it("存在しない id は undefined を返す", async () => {
    expect(await repo.findById("no-such-id")).toBeUndefined();
  });

  it("findByBeanId は該当 Bean のログだけ返す", async () => {
    const logA1 = makeLog({ beanId: BEAN_ID_A });
    const logA2 = makeLog({ beanId: BEAN_ID_A });
    const logB = makeLog({ beanId: BEAN_ID_B });
    await repo.save(logA1);
    await repo.save(logA2);
    await repo.save(logB);
    const result = await repo.findByBeanId(BEAN_ID_A);
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.beanId === BEAN_ID_A)).toBe(true);
  });

  it("delete で削除後は findById が undefined", async () => {
    const log = makeLog();
    await repo.save(log);
    await repo.delete(log.id);
    expect(await repo.findById(log.id)).toBeUndefined();
  });

  it("不正なデータが DB に混入した場合は parse エラーになる", async () => {
    const log = makeLog();
    await repo.save(log);
    await db.table("roastLogs").update(log.id, { weightBeforeG: -1 });
    await expect(repo.findById(log.id)).rejects.toThrow();
  });
});
