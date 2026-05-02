import type Dexie from "dexie";
import type { Table } from "dexie";
import {
  FLAVOR_TAG_PRESETS,
  ROAST_DEVICE_PRESETS,
  ROAST_LEVEL_PRESETS,
} from "@/db/presets";
import type { FlavorTag, RoastDevice, RoastLevel } from "@/schemas/masterData";

interface MasterTables extends Dexie {
  roastLevels: Table<RoastLevel>;
  flavorTags: Table<FlavorTag>;
  roastDevices: Table<RoastDevice>;
}

export async function seedMasterData(db: MasterTables): Promise<void> {
  await db.transaction(
    "rw",
    [db.roastLevels, db.flavorTags, db.roastDevices],
    async () => {
      if ((await db.roastLevels.count()) === 0) {
        await db.roastLevels.bulkAdd([...ROAST_LEVEL_PRESETS]);
      }
      if ((await db.flavorTags.count()) === 0) {
        await db.flavorTags.bulkAdd([...FLAVOR_TAG_PRESETS]);
      }
      if ((await db.roastDevices.count()) === 0) {
        await db.roastDevices.bulkAdd([...ROAST_DEVICE_PRESETS]);
      }
    },
  );
}
