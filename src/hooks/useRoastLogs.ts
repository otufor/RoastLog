import { useQuery } from "@tanstack/react-query";
import { db } from "@/db";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import { RoastLogRepository } from "@/repositories/roastLogRepository";

const repo = new RoastLogRepository(db.roastLogs);

export function useRoastLogs() {
  return useQuery({
    queryKey: QUERY_KEYS.roastLogs.all(),
    queryFn: () => repo.findAll(),
  });
}

export function useRoastLog(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.roastLogs.detail(id),
    queryFn: async () => (await repo.findById(id)) ?? null,
  });
}

export function usePreviousRoastLog(logId: string, beanId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.roastLogs.byBean(beanId ?? ""),
    queryFn: () => repo.findByBeanId(beanId ?? ""),
    enabled: beanId !== null,
    select: (logs) => {
      const sorted = [...logs].sort(
        (a, b) =>
          b.roastStartTime.localeCompare(a.roastStartTime) ||
          b.id.localeCompare(a.id),
      );
      const idx = sorted.findIndex((l) => l.id === logId);
      if (idx === -1 || idx === sorted.length - 1) return null;
      return sorted[idx + 1];
    },
  });
}
