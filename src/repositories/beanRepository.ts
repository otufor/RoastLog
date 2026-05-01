import type { Table } from "dexie";
import { type Bean, BeanSchema } from "@/schemas/bean";

export class BeanRepository {
  constructor(private readonly beans: Table<Bean>) {}

  async findById(id: string): Promise<Bean | undefined> {
    const raw = await this.beans.get(id);
    if (raw === undefined) return undefined;
    return BeanSchema.parse(raw);
  }

  async findAll(): Promise<Bean[]> {
    const rows = await this.beans.toArray();
    return rows.map((r) => BeanSchema.parse(r));
  }

  async save(bean: Bean): Promise<void> {
    BeanSchema.parse(bean);
    await this.beans.put(bean);
  }

  async delete(id: string): Promise<void> {
    await this.beans.delete(id);
  }

  async decrementStock(id: string, amountG: number): Promise<void> {
    await this.beans
      .where("id")
      .equals(id)
      .modify((bean) => {
        bean.stockG -= amountG;
      });
  }
}
