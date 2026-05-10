import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { BeanRepository } from "@/repositories/beanRepository";
import type { Bean, CreateBeanInput } from "@/schemas/bean";

const repo = new BeanRepository(db.beans);

export function useCreateBean() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBeanInput): Promise<Bean> => {
      const bean: Bean = {
        ...input,
        id: crypto.randomUUID(),
        bestLogId: null,
        totalG: input.totalG ?? 0,
        flavorTagIds: input.flavorTagIds ?? [],
        process: input.process ?? "",
        region: input.region ?? "",
        altitude: input.altitude ?? "",
        variety: input.variety ?? "",
      };
      await repo.save(bean);
      return bean;
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

export function useSetBestLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      beanId,
      logId,
    }: {
      beanId: string;
      logId: string;
    }) => {
      const bean = await repo.findById(beanId);
      if (!bean) return;
      await repo.save({ ...bean, bestLogId: logId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beans"] }),
  });
}
