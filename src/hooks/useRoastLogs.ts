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

export function usePreviousRoastLog(logId: string, beanId: string | null) {
  return useQuery({
    queryKey: ["roastLogs", "byBean", beanId],
    queryFn: () => repo.findByBeanId(beanId ?? ""),
    enabled: beanId !== null,
    select: (logs) => {
      const sorted = [...logs].sort(
        (a, b) =>
          b.roastDate.localeCompare(a.roastDate) || b.id.localeCompare(a.id),
      );
      const idx = sorted.findIndex((l) => l.id === logId);
      if (idx === -1 || idx === sorted.length - 1) return null;
      return sorted[idx + 1];
    },
  });
}
