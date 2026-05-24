import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import { RoastDeviceRepository } from "@/repositories/roastDeviceRepository";
import type { CreateRoastDeviceInput, RoastDevice } from "@/schemas/masterData";

const repo = new RoastDeviceRepository(db.roastDevices);

export function useRoastDevices() {
  return useQuery({
    queryKey: QUERY_KEYS.roastDevices.all(),
    queryFn: () => repo.findAll(),
  });
}

export function useCreateRoastDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoastDeviceInput): Promise<RoastDevice> => {
      const device: RoastDevice = { ...input, id: crypto.randomUUID() };
      await repo.save(device);
      return device;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roastDevices.all() }),
  });
}

export function useUpdateRoastDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (device: RoastDevice) => repo.save(device),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roastDevices.all() }),
  });
}

export function useDeleteRoastDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roastDevices.all() }),
  });
}
