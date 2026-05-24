import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import { RoastLevelRepository } from "@/repositories/roastLevelRepository";
import type { CreateRoastLevelInput, RoastLevel } from "@/schemas/masterData";

const repo = new RoastLevelRepository(db.roastLevels);

export function useRoastLevels() {
  return useQuery({
    queryKey: QUERY_KEYS.roastLevels.all(),
    queryFn: () => repo.findAll(),
  });
}

export function useCreateRoastLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoastLevelInput): Promise<RoastLevel> => {
      const level: RoastLevel = { ...input, id: crypto.randomUUID() };
      await repo.save(level);
      return level;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roastLevels.all() }),
  });
}

export function useUpdateRoastLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (level: RoastLevel) => repo.save(level),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roastLevels.all() }),
  });
}

export function useDeleteRoastLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roastLevels.all() }),
  });
}
