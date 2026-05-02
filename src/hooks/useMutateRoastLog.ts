import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { BeanRepository } from "@/repositories/beanRepository";
import { RoastLogRepository } from "@/repositories/roastLogRepository";
import type { CreateRoastLogInput, RoastLog } from "@/schemas/roastLog";

const repo = new RoastLogRepository(db.roastLogs);
const beanRepo = new BeanRepository(db.beans);

export function useCreateRoastLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoastLogInput): Promise<RoastLog> => {
      const log: RoastLog = { ...input, id: crypto.randomUUID() };
      await repo.save(log);
      await beanRepo.decrementStock(input.beanId, input.weightBeforeG);
      return log;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roastLogs"] });
      qc.invalidateQueries({ queryKey: ["beans"] });
    },
  });
}

export function useUpdateRoastLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (log: RoastLog) => repo.save(log),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roastLogs"] }),
  });
}

export function useDeleteRoastLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roastLogs"] }),
  });
}
