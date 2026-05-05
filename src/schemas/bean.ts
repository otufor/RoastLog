import { z } from "zod";

export const BeanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  origin: z.string(),
  productName: z.string(),
  shopName: z.string(),
  purchasedAt: z.string().nullable(),
  importedAt: z.string().nullable(),
  stockG: z.number(),
  bestLogId: z.string().uuid().nullable(),
  note: z.string(),
  totalG: z.number().optional().default(0),
  flavorTagIds: z.array(z.string()).optional().default([]),
  process: z.string().optional().default(""),
  region: z.string().optional().default(""),
  altitude: z.string().optional().default(""),
  variety: z.string().optional().default(""),
});

export type Bean = z.infer<typeof BeanSchema>;

export const CreateBeanInputSchema = BeanSchema.omit({
  id: true,
  bestLogId: true,
});
export type CreateBeanInput = z.infer<typeof CreateBeanInputSchema>;
