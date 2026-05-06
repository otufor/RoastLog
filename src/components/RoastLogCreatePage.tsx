import { useNavigate } from "@tanstack/react-router";
import { RoastLogForm } from "@/components/RoastLogForm";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useBeans } from "@/hooks/useBeans";
import { useFlavorTags } from "@/hooks/useFlavorTags";
import { useCreateRoastLog } from "@/hooks/useMutateRoastLog";
import { useRoastDevices } from "@/hooks/useRoastDevices";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useWeather } from "@/hooks/useWeather";
import type { CreateRoastLogInput } from "@/schemas/roastLog";

const EMPTY_DEFAULTS: CreateRoastLogInput = {
  beanId: "",
  roastDate: "",
  roastLevelId: "",
  roastDeviceId: null,
  roastDurationSec: 0,
  firstCrackSec: null,
  secondCrackSec: null,
  weightBeforeG: 0,
  weightAfterG: 0,
  outdoorTempC: null,
  outdoorHumidity: null,
  indoorTempC: null,
  tempSource: "manual",
  weatherCode: null,
  tasting: null,
  overallScore: null,
  processNote: "",
};

export function RoastLogCreatePage() {
  const navigate = useNavigate();
  const { mutateAsync } = useCreateRoastLog();
  const { data: beans = [], isLoading: beansLoading } = useBeans();
  const { data: levels = [], isLoading: levelsLoading } = useRoastLevels();
  const { data: devices = [], isLoading: devicesLoading } = useRoastDevices();
  const { data: flavorTags = [], isLoading: flavorTagsLoading } =
    useFlavorTags();
  const { data: appSettings, isLoading: settingsLoading } = useAppSettings();
  const weather = useWeather(
    appSettings?.locationLat ?? null,
    appSettings?.locationLon ?? null,
  );

  if (
    beansLoading ||
    levelsLoading ||
    devicesLoading ||
    flavorTagsLoading ||
    settingsLoading ||
    weather.isLoading
  )
    return null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const defaultValues: CreateRoastLogInput = {
    ...EMPTY_DEFAULTS,
    roastDate: todayStr,
    beanId: beans[0]?.id ?? "",
    roastLevelId: levels[0]?.id ?? "",
    roastDeviceId: devices[0]?.id ?? null,
    outdoorTempC: weather.data?.outdoorTempC ?? null,
    outdoorHumidity: weather.data?.outdoorHumidity ?? null,
    weatherCode: weather.data?.weatherCode ?? null,
    tempSource: weather.data ? "auto" : "manual",
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">新しい焙煎を記録</h1>
      <RoastLogForm
        defaultValues={defaultValues}
        beans={beans}
        roastLevels={levels}
        roastDevices={devices}
        flavorTags={flavorTags}
        submitLabel="登録"
        onSubmit={async (input: CreateRoastLogInput) => {
          const log = await mutateAsync(input);
          await navigate({ to: "/logs/$logId", params: { logId: log.id } });
        }}
      />
    </div>
  );
}
