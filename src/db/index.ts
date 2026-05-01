import Dexie, { type Table } from "dexie";
import type { Bean } from "@/schemas/bean";
import type { RoastLog } from "@/schemas/roastLog";

class RoastLogDB extends Dexie {
  beans!: Table<Bean>;
  roastLogs!: Table<RoastLog>;

  constructor() {
    super("RoastLogDB");
    this.version(1).stores({
      beans: "id, name, stockG",
      roastLogs: "id, beanId, roastDate",
    });
  }
}

export const db = new RoastLogDB();
