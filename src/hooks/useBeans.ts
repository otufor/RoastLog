import { useQuery } from "@tanstack/react-query";
import { db } from "@/db";
import { BeanRepository } from "@/repositories/beanRepository";

const repo = new BeanRepository(db.beans);

export function useBeans() {
  return useQuery({
    queryKey: ["beans"],
    queryFn: () => repo.findAll(),
  });
}

export function useBean(id: string) {
  return useQuery({
    queryKey: ["beans", id],
    queryFn: async () => (await repo.findById(id)) ?? null,
  });
}
