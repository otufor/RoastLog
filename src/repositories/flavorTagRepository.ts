import type { Table } from "dexie";
import { BaseRepository } from "@/repositories/base";
import { type FlavorTag, FlavorTagSchema } from "@/schemas/masterData";

export class FlavorTagRepository extends BaseRepository<FlavorTag> {
  constructor(flavorTags: Table<FlavorTag>) {
    super(flavorTags, FlavorTagSchema);
  }
}
