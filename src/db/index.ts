import Dexie, { type Table } from "dexie";
import type { Bean } from "@/schemas/bean";
import type { FlavorTag, RoastDevice, RoastLevel } from "@/schemas/masterData";
import type { RoastLog } from "@/schemas/roastLog";

class RoastLogDB extends Dexie {
  beans!: Table<Bean>;
  roastLogs!: Table<RoastLog>;
  roastLevels!: Table<RoastLevel>;
  flavorTags!: Table<FlavorTag>;
  roastDevices!: Table<RoastDevice>;

  constructor() {
    super("RoastLogDB");
    this.version(1).stores({
      beans: "id, name, stockG",
      roastLogs: "id, beanId, roastDate",
    });
    this.version(2).stores({
      beans: "id, name, stockG",
      roastLogs: "id, beanId, roastDate",
      roastLevels: "id, order",
      flavorTags: "id, name",
      roastDevices: "id, name",
    });
  }
}

export const db = new RoastLogDB();
