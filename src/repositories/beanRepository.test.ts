import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BeanRepository } from "@/repositories/beanRepository";
import type { Bean } from "@/schemas/bean";

let db: Dexie;
let repo: BeanRepository;

beforeEach(() => {
  db = new Dexie(`roastlog-test-${crypto.randomUUID()}`);
  db.version(1).stores({ beans: "id, name, stockG" });
  repo = new BeanRepository(db.table("beans"));
});

afterEach(async () => {
  await db.close();
  await Dexie.delete(db.name);
});

const makeBean = (overrides: Partial<Bean> = {}): Bean => ({
  id: crypto.randomUUID(),
  name: "エチオピア イルガチェフェ",
  origin: "エチオピア",
  productName: "G1 ナチュラル 2023クロップ",
  shopName: "丸山珈琲",
  purchasedAt: "2024-01-15",
  importedAt: null,
  stockG: 500,
  bestLogId: null,
  note: "",
  ...overrides,
});

describe("BeanRepository", () => {
  it("save した Bean を findById で取得できる", async () => {
    const bean = makeBean();
    await repo.save(bean);
    expect(await repo.findById(bean.id)).toEqual(bean);
  });

  it("存在しない id は undefined を返す", async () => {
    expect(await repo.findById("no-such-id")).toBeUndefined();
  });

  it("findAll は保存した全件を返す", async () => {
    const a = makeBean({ name: "ブラジル セラード" });
    const b = makeBean({ name: "コロンビア ウイラ" });
    await repo.save(a);
    await repo.save(b);
    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it("delete で削除後は findById が undefined", async () => {
    const bean = makeBean();
    await repo.save(bean);
    await repo.delete(bean.id);
    expect(await repo.findById(bean.id)).toBeUndefined();
  });

  it("decrementStock で stockG が減る", async () => {
    const bean = makeBean({ stockG: 500 });
    await repo.save(bean);
    await repo.decrementStock(bean.id, 250);
    expect((await repo.findById(bean.id))?.stockG).toBe(250);
  });

  it("在庫がマイナスになっても保存できる（ADR-0002）", async () => {
    const bean = makeBean({ stockG: 100 });
    await repo.save(bean);
    await repo.decrementStock(bean.id, 200);
    expect((await repo.findById(bean.id))?.stockG).toBe(-100);
  });
});
