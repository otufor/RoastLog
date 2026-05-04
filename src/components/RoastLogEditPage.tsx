import { useNavigate } from "@tanstack/react-router";
import { RoastLogForm } from "@/components/RoastLogForm";
import { useBeans } from "@/hooks/useBeans";
import { useUpdateRoastLog } from "@/hooks/useMutateRoastLog";
import { useRoastDevices } from "@/hooks/useRoastDevices";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useRoastLog } from "@/hooks/useRoastLogs";
import type { CreateRoastLogInput } from "@/schemas/roastLog";

interface RoastLogEditPageProps {
  logId: string;
}

export function RoastLogEditPage({ logId }: RoastLogEditPageProps) {
  const navigate = useNavigate();
  const { data: log, isLoading: logLoading } = useRoastLog(logId);
  const { data: beans = [], isLoading: beansLoading } = useBeans();
  const { data: levels = [], isLoading: levelsLoading } = useRoastLevels();
  const { data: devices = [], isLoading: devicesLoading } = useRoastDevices();
  const { mutateAsync: updateLog } = useUpdateRoastLog();

  if (logLoading || beansLoading || levelsLoading || devicesLoading)
    return null;
  if (!log) return <p>ログが見つかりません</p>;

  const defaultValues: CreateRoastLogInput = {
    beanId: log.beanId,
    roastDate: log.roastDate,
    roastLevelId: log.roastLevelId,
    roastDeviceId: log.roastDeviceId,
    roastDurationSec: log.roastDurationSec,
    firstCrackSec: log.firstCrackSec,
    secondCrackSec: log.secondCrackSec,
    weightBeforeG: log.weightBeforeG,
    weightAfterG: log.weightAfterG,
    outdoorTempC: log.outdoorTempC,
    outdoorHumidity: log.outdoorHumidity,
    indoorTempC: log.indoorTempC,
    tempSource: log.tempSource,
    weatherCode: log.weatherCode,
    tasting: log.tasting,
    overallScore: log.overallScore,
    processNote: log.processNote,
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">焙煎ログを編集</h1>
      <RoastLogForm
        defaultValues={defaultValues}
        beans={beans}
        roastLevels={levels}
        roastDevices={devices}
        submitLabel="保存"
        onSubmit={async (input: CreateRoastLogInput) => {
          await updateLog({ ...log, ...input });
          await navigate({ to: "/logs/$logId", params: { logId } });
        }}
      />
    </div>
  );
}
