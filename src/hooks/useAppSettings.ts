import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import {
  type AppSettings,
  AppSettingsSchema,
  DEFAULT_APP_SETTINGS,
} from "@/schemas/appSettings";

const STORAGE_KEY = "roastlog.appSettings";

function readSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return DEFAULT_APP_SETTINGS;
  try {
    const parsed = AppSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_APP_SETTINGS;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function writeSettings(settings: AppSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useAppSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.appSettings.all(),
    queryFn: () => readSettings(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useUpdateAppSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: AppSettings): Promise<AppSettings> => {
      const validated = AppSettingsSchema.parse(settings);
      writeSettings(validated);
      return validated;
    },
    onSuccess: (settings) => {
      qc.setQueryData(QUERY_KEYS.appSettings.all(), settings);
    },
  });
}
