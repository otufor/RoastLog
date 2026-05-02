import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RoastLevelRepository } from "@/repositories/roastLevelRepository";
import type { RoastLevel } from "@/schemas/masterData";

let db: Dexie;
let repo: RoastLevelRepository;

beforeEach(() => {
  db = new Dexie(`roastlog-test-${crypto.randomUUID()}`);
  db.version(1).stores({ roastLevels: "id, order" });
  repo = new RoastLevelRepository(db.table("roastLevels"));
});

afterEach(async () => {
  await db.close();
  await Dexie.delete(db.name);
});

const makeLevel = (overrides: Partial<RoastLevel> = {}): RoastLevel => ({
  id: crypto.randomUUID(),
  label: "中煎り",
  color: "#B06B1E",
  order: 3,
  ...overrides,
});

describe("RoastLevelRepository", () => {
  it("save した RoastLevel を findById で取得できる", async () => {
    const level = makeLevel();
    await repo.save(level);
    expect(await repo.findById(level.id)).toEqual(level);
  });

  it("findAll は order 昇順で返す", async () => {
    await repo.save(makeLevel({ label: "深煎り", order: 5 }));
    await repo.save(makeLevel({ label: "生豆", order: 0 }));
    await repo.save(makeLevel({ label: "中煎り", order: 3 }));
    const all = await repo.findAll();
    expect(all.map((l) => l.label)).toEqual(["生豆", "中煎り", "深煎り"]);
  });

  it("delete で削除できる", async () => {
    const level = makeLevel();
    await repo.save(level);
    await repo.delete(level.id);
    expect(await repo.findById(level.id)).toBeUndefined();
  });
});
