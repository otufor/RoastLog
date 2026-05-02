import { z } from "zod";

export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

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

export const CreateRoastLevelInputSchema = RoastLevelSchema.omit({ id: true });
export type CreateRoastLevelInput = z.infer<typeof CreateRoastLevelInputSchema>;

export const CreateFlavorTagInputSchema = FlavorTagSchema.omit({ id: true });
export type CreateFlavorTagInput = z.infer<typeof CreateFlavorTagInputSchema>;

export const CreateRoastDeviceInputSchema = RoastDeviceSchema.omit({
  id: true,
});
export type CreateRoastDeviceInput = z.infer<
  typeof CreateRoastDeviceInputSchema
>;
