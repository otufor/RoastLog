import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { RoastLogFormValues } from "@/components/RoastLogForm";
import { RoastLogForm } from "@/components/RoastLogForm";
import { isStockInsufficient } from "@/domain/roastLog";
import { buildTasting } from "@/domain/tasting";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useBeans } from "@/hooks/useBeans";
import { useFlavorTags } from "@/hooks/useFlavorTags";
import { useCreateRoastLog } from "@/hooks/useMutateRoastLog";
import { useRoastDevices } from "@/hooks/useRoastDevices";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useRoastLog } from "@/hooks/useRoastLogs";
import { useWeather } from "@/hooks/useWeather";
import type { CreateRoastLogInput } from "@/schemas/roastLog";

const DRAFT_KEY = "roastlog-new-draft";

function readDraft(): RoastLogFormValues | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(DRAFT_KEY) ?? "null",
    ) as RoastLogFormValues | null;
  } catch {
    return null;
  }
}

function applyDraft(
  base: CreateRoastLogInput,
  draft: RoastLogFormValues,
): CreateRoastLogInput {
  const tasting = buildTasting(
    draft.flavorTagIds,
    draft.sweetness,
    draft.acidity,
    draft.body,
    draft.bitterness,
    draft.aftertaste,
    draft.cleanliness,
  );
  return {
    ...base,
    beanId: draft.beanId,
    roastDate: draft.roastDate,
    roastLevelId: draft.roastLevelId,
    roastDeviceId: draft.roastDeviceId,
    roastDurationSec: draft.roastDurationSec,
    firstCrackSec: draft.firstCrackSec,
    secondCrackSec: draft.secondCrackSec,
    weightBeforeG: draft.weightBeforeG,
    weightAfterG: draft.weightAfterG,
    indoorTempC: draft.indoorTempC,
    processNote: draft.processNote,
    tasting,
    overallScore: draft.overallScore,
  };
}

const EMPTY_DEFAULTS: CreateRoastLogInput = {
  beanId: "",
  roastDate: "",
  roastLevelId: "",
  roastDeviceId: null,
  roastDurationSec: 10 * 60,
  firstCrackSec: 8 * 60,
  secondCrackSec: 13 * 60,
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

interface RoastLogCreatePageProps {
  fromLogId?: string;
}

export function RoastLogCreatePage({ fromLogId }: RoastLogCreatePageProps) {
  const navigate = useNavigate();
  const { mutateAsync } = useCreateRoastLog();
  const [pendingInput, setPendingInput] = useState<CreateRoastLogInput | null>(
    null,
  );
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
  const { data: sourceLog, isLoading: sourceLogLoading } = useRoastLog(
    fromLogId ?? "",
  );

  if (
    beansLoading ||
    levelsLoading ||
    devicesLoading ||
    flavorTagsLoading ||
    settingsLoading ||
    weather.isLoading ||
    (fromLogId != null && sourceLogLoading)
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
    ...(sourceLog
      ? {
          beanId: sourceLog.beanId,
          roastLevelId: sourceLog.roastLevelId,
          roastDeviceId: sourceLog.roastDeviceId,
          roastDurationSec: sourceLog.roastDurationSec,
          firstCrackSec: sourceLog.firstCrackSec,
          secondCrackSec: sourceLog.secondCrackSec,
          indoorTempC: sourceLog.indoorTempC,
        }
      : {}),
  };

  const draft = fromLogId ? null : readDraft();
  const resolvedDefaults = draft
    ? applyDraft(defaultValues, draft)
    : defaultValues;

  function handleValuesChange(values: RoastLogFormValues) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  }

  async function handleSubmit(input: CreateRoastLogInput) {
    const bean = beans.find((b) => b.id === input.beanId);
    if (bean && isStockInsufficient(bean.stockG, input.weightBeforeG)) {
      setPendingInput(input);
      return;
    }
    await save(input);
  }

  async function save(input: CreateRoastLogInput) {
    sessionStorage.removeItem(DRAFT_KEY);
    const log = await mutateAsync(input);
    await navigate({ to: "/logs/$logId", params: { logId: log.id } });
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">新しい焙煎を記録</h1>
      <RoastLogForm
        defaultValues={resolvedDefaults}
        beans={beans}
        roastLevels={levels}
        roastDevices={devices}
        flavorTags={flavorTags}
        submitLabel="登録"
        onSubmit={handleSubmit}
        onValuesChange={fromLogId ? undefined : handleValuesChange}
      />
      {pendingInput && (
        <div
          role="dialog"
          aria-labelledby="stock-warning-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="mx-4 max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 id="stock-warning-title" className="mb-3 text-lg font-semibold">
              在庫不足の確認
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              在庫（
              {beans.find((b) => b.id === pendingInput.beanId)?.stockG ?? 0}
              g）より多い{pendingInput.weightBeforeG}
              gを使用します。このまま保存しますか？
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setPendingInput(null)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={async () => {
                  setPendingInput(null);
                  await save(pendingInput);
                }}
              >
                それでも保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
