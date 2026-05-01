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
});

export type Bean = z.infer<typeof BeanSchema>;
