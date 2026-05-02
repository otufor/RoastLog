import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RoastDeviceRepository } from "@/repositories/roastDeviceRepository";
import type { RoastDevice } from "@/schemas/masterData";

let db: Dexie;
let repo: RoastDeviceRepository;

beforeEach(() => {
  db = new Dexie(`roastlog-test-${crypto.randomUUID()}`);
  db.version(1).stores({ roastDevices: "id, name" });
  repo = new RoastDeviceRepository(db.table("roastDevices"));
});

afterEach(async () => {
  await db.close();
  await Dexie.delete(db.name);
});

const makeDevice = (overrides: Partial<RoastDevice> = {}): RoastDevice => ({
  id: crypto.randomUUID(),
  name: "weroast HOME ROASTER",
  method: "直火式",
  note: "",
  ...overrides,
});

describe("RoastDeviceRepository", () => {
  it("save した RoastDevice を findById で取得できる", async () => {
    const device = makeDevice();
    await repo.save(device);
    expect(await repo.findById(device.id)).toEqual(device);
  });

  it("findAll で複数件取得できる", async () => {
    await repo.save(makeDevice({ name: "Aillio Bullet" }));
    await repo.save(makeDevice({ name: "Behmor 2000AB" }));
    expect(await repo.findAll()).toHaveLength(2);
  });

  it("delete で削除できる", async () => {
    const device = makeDevice();
    await repo.save(device);
    await repo.delete(device.id);
    expect(await repo.findById(device.id)).toBeUndefined();
  });
});
