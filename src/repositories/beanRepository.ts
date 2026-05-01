import type { Table } from "dexie";
import { BaseRepository } from "@/repositories/base";
import { type Bean, BeanSchema } from "@/schemas/bean";

export class BeanRepository extends BaseRepository<Bean> {
  constructor(beans: Table<Bean>) {
    super(beans, BeanSchema);
  }

  async decrementStock(id: string, amountG: number): Promise<void> {
    await this.table
      .where("id")
      .equals(id)
      .modify((bean) => {
        bean.stockG -= amountG;
      });
  }
}
