import { useQuery } from "@tanstack/react-query";
import { db } from "@/db";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import { BeanRepository } from "@/repositories/beanRepository";

const repo = new BeanRepository(db.beans);

export function useBeans() {
  return useQuery({
    queryKey: QUERY_KEYS.beans.all(),
    queryFn: () => repo.findAll(),
  });
}

export function useBean(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.beans.detail(id),
    queryFn: async () => (await repo.findById(id)) ?? null,
  });
}
