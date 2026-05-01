import type { Table } from "dexie";

interface Parseable<T> {
  parse(data: unknown): T;
}

export abstract class BaseRepository<T extends object> {
  constructor(
    protected readonly table: Table<T>,
    private readonly schema: Parseable<T>,
  ) {}

  protected parseRow(raw: unknown): T {
    return this.schema.parse(raw);
  }

  async findById(id: string): Promise<T | undefined> {
    const raw = await this.table.get(id);
    if (raw === undefined) return undefined;
    return this.schema.parse(raw);
  }

  async findAll(): Promise<T[]> {
    const rows = await this.table.toArray();
    return rows.map((r) => this.schema.parse(r));
  }

  async save(item: T): Promise<void> {
    await this.table.put(item);
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }
}
