import type { Table } from "dexie";
import { BaseRepository } from "@/repositories/base";
import { type RoastDevice, RoastDeviceSchema } from "@/schemas/masterData";

export class RoastDeviceRepository extends BaseRepository<RoastDevice> {
  constructor(roastDevices: Table<RoastDevice>) {
    super(roastDevices, RoastDeviceSchema);
  }
}
