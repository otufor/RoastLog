import { z } from "zod";

export const AppSettingsSchema = z.object({
  locationLat: z.number().min(-90).max(90).nullable(),
  locationLon: z.number().min(-180).max(180).nullable(),
  locationLabel: z.string(),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  locationLat: null,
  locationLon: null,
  locationLabel: "",
};
