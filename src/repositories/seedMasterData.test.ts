import Dexie, { type Table } from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FLAVOR_TAG_PRESETS,
  ROAST_DEVICE_PRESETS,
  ROAST_LEVEL_PRESETS,
} from "@/db/presets";
import { seedMasterData } from "@/repositories/seedMasterData";
import type { FlavorTag, RoastDevice, RoastLevel } from "@/schemas/masterData";

interface TestDB extends Dexie {
  roastLevels: Table<RoastLevel>;
  flavorTags: Table<FlavorTag>;
  roastDevices: Table<RoastDevice>;
}

let db: TestDB;

beforeEach(() => {
  db = new Dexie(`roastlog-test-${crypto.randomUUID()}`) as TestDB;
  db.version(1).stores({
    roastLevels: "id, order",
    flavorTags: "id, name",
    roastDevices: "id, name",
  });
});

afterEach(async () => {
  await db.close();
  await Dexie.delete(db.name);
});

describe("seedMasterData", () => {
  it("空の DB に全プリセットを書き込む", async () => {
    await seedMasterData(db);

    expect(await db.roastLevels.count()).toBe(ROAST_LEVEL_PRESETS.length);
    expect(await db.flavorTags.count()).toBe(FLAVOR_TAG_PRESETS.length);
    expect(await db.roastDevices.count()).toBe(ROAST_DEVICE_PRESETS.length);
  });

  it("既にデータがあれば追加しない（idempotent）", async () => {
    await seedMasterData(db);
    await seedMasterData(db);

    expect(await db.roastLevels.count()).toBe(ROAST_LEVEL_PRESETS.length);
    expect(await db.flavorTags.count()).toBe(FLAVOR_TAG_PRESETS.length);
    expect(await db.roastDevices.count()).toBe(ROAST_DEVICE_PRESETS.length);
  });

  it("一部のテーブルだけ空でも、空のテーブルだけシードする", async () => {
    await db.roastLevels.add(ROAST_LEVEL_PRESETS[0]);

    await seedMasterData(db);

    expect(await db.roastLevels.count()).toBe(1);
    expect(await db.flavorTags.count()).toBe(FLAVOR_TAG_PRESETS.length);
    expect(await db.roastDevices.count()).toBe(ROAST_DEVICE_PRESETS.length);
  });
});
