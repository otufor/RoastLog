import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { BeanRepository } from "@/repositories/beanRepository";
import type { Bean, CreateBeanInput } from "@/schemas/bean";

const repo = new BeanRepository(db.beans);

export function useCreateBean() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBeanInput) => {
      const bean = { ...input, id: crypto.randomUUID(), bestLogId: null };
      await repo.save(bean);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beans"] }),
  });
}

export function useUpdateBean() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bean: Bean) => repo.save(bean),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beans"] }),
  });
}

export function useDeleteBean() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beans"] }),
  });
}
