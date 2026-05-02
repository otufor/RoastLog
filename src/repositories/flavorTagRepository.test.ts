import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FlavorTagRepository } from "@/repositories/flavorTagRepository";
import type { FlavorTag } from "@/schemas/masterData";

let db: Dexie;
let repo: FlavorTagRepository;

beforeEach(() => {
  db = new Dexie(`roastlog-test-${crypto.randomUUID()}`);
  db.version(1).stores({ flavorTags: "id, name" });
  repo = new FlavorTagRepository(db.table("flavorTags"));
});

afterEach(async () => {
  await db.close();
  await Dexie.delete(db.name);
});

const makeTag = (overrides: Partial<FlavorTag> = {}): FlavorTag => ({
  id: crypto.randomUUID(),
  name: "フローラル",
  color: "#FF69B4",
  ...overrides,
});

describe("FlavorTagRepository", () => {
  it("save した FlavorTag を findById で取得できる", async () => {
    const tag = makeTag();
    await repo.save(tag);
    expect(await repo.findById(tag.id)).toEqual(tag);
  });

  it("findAll で複数件取得できる", async () => {
    await repo.save(makeTag({ name: "チョコレート" }));
    await repo.save(makeTag({ name: "ベリー" }));
    expect(await repo.findAll()).toHaveLength(2);
  });

  it("delete で削除できる", async () => {
    const tag = makeTag();
    await repo.save(tag);
    await repo.delete(tag.id);
    expect(await repo.findById(tag.id)).toBeUndefined();
  });
});
