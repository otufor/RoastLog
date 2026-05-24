import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import { FlavorTagRepository } from "@/repositories/flavorTagRepository";
import type { CreateFlavorTagInput, FlavorTag } from "@/schemas/masterData";

const repo = new FlavorTagRepository(db.flavorTags);

export function useFlavorTags() {
  return useQuery({
    queryKey: QUERY_KEYS.flavorTags.all(),
    queryFn: () => repo.findAll(),
  });
}

export function useCreateFlavorTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFlavorTagInput): Promise<FlavorTag> => {
      const tag: FlavorTag = { ...input, id: crypto.randomUUID() };
      await repo.save(tag);
      return tag;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.flavorTags.all() }),
  });
}

export function useUpdateFlavorTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: FlavorTag) => repo.save(tag),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.flavorTags.all() }),
  });
}

export function useDeleteFlavorTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.flavorTags.all() }),
  });
}
