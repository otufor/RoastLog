import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { RoastLevelRepository } from "@/repositories/roastLevelRepository";
import type { CreateRoastLevelInput, RoastLevel } from "@/schemas/masterData";

const repo = new RoastLevelRepository(db.roastLevels);
const KEY = ["roastLevels"] as const;

export function useRoastLevels() {
  return useQuery({
    queryKey: KEY,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRoastLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (level: RoastLevel) => repo.save(level),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRoastLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
