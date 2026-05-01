import { z } from "zod";

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const RoastLevelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: HexColorSchema,
  order: z.number().int().nonnegative(),
});

export const FlavorTagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: HexColorSchema,
});

export const RoastDeviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  method: z.string(),
  note: z.string(),
});

export type RoastLevel = z.infer<typeof RoastLevelSchema>;
export type FlavorTag = z.infer<typeof FlavorTagSchema>;
export type RoastDevice = z.infer<typeof RoastDeviceSchema>;
