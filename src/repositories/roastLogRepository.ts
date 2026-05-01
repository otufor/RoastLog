import type { Table } from "dexie";
import { BaseRepository } from "@/repositories/base";
import { type RoastLog, RoastLogSchema } from "@/schemas/roastLog";

export class RoastLogRepository extends BaseRepository<RoastLog> {
  constructor(roastLogs: Table<RoastLog>) {
    super(roastLogs, RoastLogSchema);
  }

  async findByBeanId(beanId: string): Promise<RoastLog[]> {
    const rows = await this.table.where("beanId").equals(beanId).toArray();
    return rows.map((r) => this.parseRow(r));
  }
}
