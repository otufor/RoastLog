import { z } from "zod";

export const OpenMeteoResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number().int().min(0).max(100),
    weather_code: z.number().int(),
  }),
});

export type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;
