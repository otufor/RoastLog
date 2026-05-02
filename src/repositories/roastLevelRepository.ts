import type { Table } from "dexie";
import { BaseRepository } from "@/repositories/base";
import { type RoastLevel, RoastLevelSchema } from "@/schemas/masterData";

export class RoastLevelRepository extends BaseRepository<RoastLevel> {
  constructor(roastLevels: Table<RoastLevel>) {
    super(roastLevels, RoastLevelSchema);
  }

  override async findAll(): Promise<RoastLevel[]> {
    const rows = await this.table.orderBy("order").toArray();
    return rows.map((r) => this.parseRow(r));
  }
}
