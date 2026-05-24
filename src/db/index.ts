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
    this.version(3)
      .stores({
        beans: "id, name, stockG",
        roastLogs: "id, beanId, roastStartTime",
        roastLevels: "id, order",
        flavorTags: "id, name",
        roastDevices: "id, name",
      })
      .upgrade(async (tx) => {
        await tx
          .table("roastLogs")
          .toCollection()
          .modify((log: Record<string, unknown>) => {
            if (log.roastDate && !log.roastStartTime) {
              log.roastStartTime = `${log.roastDate}T00:00`;
              delete log.roastDate;
            }
          });
      });
  }
}

export const db = new RoastLogDB();
