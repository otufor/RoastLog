import { useQuery } from "@tanstack/react-query";
import { db } from "@/db";
import { RoastLogRepository } from "@/repositories/roastLogRepository";

const repo = new RoastLogRepository(db.roastLogs);

export function useRoastLogs() {
  return useQuery({
    queryKey: ["roastLogs"],
    queryFn: () => repo.findAll(),
  });
}

export function useRoastLog(id: string) {
  return useQuery({
    queryKey: ["roastLogs", id],
    queryFn: async () => (await repo.findById(id)) ?? null,
  });
}
