export const QUERY_KEYS = {
  beans: {
    all: () => ["beans"] as const,
    detail: (id: string) => ["beans", id] as const,
  },
  roastLogs: {
    all: () => ["roastLogs"] as const,
    detail: (id: string) => ["roastLogs", id] as const,
    byBean: (beanId: string) => ["roastLogs", "byBean", beanId] as const,
  },
  flavorTags: {
    all: () => ["flavorTags"] as const,
  },
  roastLevels: {
    all: () => ["roastLevels"] as const,
  },
  roastDevices: {
    all: () => ["roastDevices"] as const,
  },
  appSettings: {
    all: () => ["appSettings"] as const,
  },
} as const;
