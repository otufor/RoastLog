import { z } from "zod";

const TastingScoreSchema = z.number().int().min(1).max(5);

export const TastingSchema = z.object({
  flavorTags: z.array(z.string()),
  sweetness: TastingScoreSchema,
  acidity: TastingScoreSchema,
  body: TastingScoreSchema,
  bitterness: TastingScoreSchema,
  aftertaste: TastingScoreSchema,
  cleanliness: TastingScoreSchema,
});

export const RoastLogSchema = z.object({
  id: z.string().uuid(),
  beanId: z.string().uuid(),
  roastDate: z.string(),
  roastLevelId: z.string(),
  roastDeviceId: z.string().nullable(),
  roastDurationSec: z.number().int().nonnegative(),
  firstCrackSec: z.number().int().nonnegative().nullable(),
  secondCrackSec: z.number().int().nonnegative().nullable(),
  weightBeforeG: z.number().positive(),
  weightAfterG: z.number().positive(),
  outdoorTempC: z.number().nullable(),
  outdoorHumidity: z.number().min(0).max(100).nullable(),
  indoorTempC: z.number().nullable(),
  tempSource: z.enum(["auto", "manual"]),
  weatherCode: z.number().int().nullable(),
  tasting: TastingSchema.nullable(),
  overallScore: z.number().int().min(1).max(5).nullable(),
  processNote: z.string(),
});

export type Tasting = z.infer<typeof TastingSchema>;
export type RoastLog = z.infer<typeof RoastLogSchema>;
