import type { Table } from "dexie";
import { type RoastLog, RoastLogSchema } from "@/schemas/roastLog";

export class RoastLogRepository {
  constructor(private readonly roastLogs: Table<RoastLog>) {}

  async findById(id: string): Promise<RoastLog | undefined> {
    const raw = await this.roastLogs.get(id);
    if (raw === undefined) return undefined;
    return RoastLogSchema.parse(raw);
  }

  async findByBeanId(beanId: string): Promise<RoastLog[]> {
    const rows = await this.roastLogs.where("beanId").equals(beanId).toArray();
    return rows.map((r) => RoastLogSchema.parse(r));
  }

  async findAll(): Promise<RoastLog[]> {
    const rows = await this.roastLogs.toArray();
    return rows.map((r) => RoastLogSchema.parse(r));
  }

  async save(log: RoastLog): Promise<void> {
    RoastLogSchema.parse(log);
    await this.roastLogs.put(log);
  }

  async delete(id: string): Promise<void> {
    await this.roastLogs.delete(id);
  }
}
