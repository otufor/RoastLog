import { useNavigate } from "@tanstack/react-router";
import { calcWeightLossRate } from "@/domain/roastLog";
import { useBeans } from "@/hooks/useBeans";
import { useDeleteRoastLog } from "@/hooks/useMutateRoastLog";
import { useRoastDevices } from "@/hooks/useRoastDevices";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useRoastLog } from "@/hooks/useRoastLogs";

function formatSec(sec: number | null): string {
  if (sec === null) return "—";
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

interface RoastLogDetailPageProps {
  logId: string;
}

export function RoastLogDetailPage({ logId }: RoastLogDetailPageProps) {
  const navigate = useNavigate();
  const { data: log, isLoading: logLoading } = useRoastLog(logId);
  const { data: beans = [], isLoading: beansLoading } = useBeans();
  const { data: levels = [], isLoading: levelsLoading } = useRoastLevels();
  const { data: devices = [], isLoading: devicesLoading } = useRoastDevices();
  const { mutateAsync: deleteLog } = useDeleteRoastLog();

  if (logLoading || beansLoading || levelsLoading || devicesLoading)
    return null;
  if (!log) return <p>ログが見つかりません</p>;

  const bean = beans.find((b) => b.id === log.beanId);
  const level = levels.find((l) => l.id === log.roastLevelId);
  const device = devices.find((d) => d.id === log.roastDeviceId);
  const rate = calcWeightLossRate(log.weightBeforeG, log.weightAfterG);

  const handleDelete = async () => {
    await deleteLog(logId);
    await navigate({ to: "/logs" });
  };

  const handleEdit = async () => {
    await navigate({ to: "/logs/$logId/edit", params: { logId } });
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{bean?.name ?? "—"}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEdit}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
          >
            削除
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">焙煎日</dt>
        <dd>{log.roastDate}</dd>

        <dt className="text-muted-foreground">焙煎度</dt>
        <dd>{level?.label ?? "—"}</dd>

        <dt className="text-muted-foreground">焙煎機</dt>
        <dd>{device?.name ?? "—"}</dd>

        <dt className="text-muted-foreground">焙煎時間</dt>
        <dd>{formatSec(log.roastDurationSec)}</dd>

        <dt className="text-muted-foreground">1ハゼ</dt>
        <dd>{formatSec(log.firstCrackSec)}</dd>

        <dt className="text-muted-foreground">2ハゼ</dt>
        <dd>{formatSec(log.secondCrackSec)}</dd>

        <dt className="text-muted-foreground">焙煎前重量</dt>
        <dd>{log.weightBeforeG}g</dd>

        <dt className="text-muted-foreground">焙煎後重量</dt>
        <dd>{log.weightAfterG}g</dd>

        <dt className="text-muted-foreground">重量減少率</dt>
        <dd>{rate.toFixed(1)}%</dd>

        <dt className="text-muted-foreground">室内温度</dt>
        <dd>{log.indoorTempC != null ? `${log.indoorTempC}℃` : "—"}</dd>
      </dl>

      {log.processNote && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">焙煎メモ</p>
          <p className="text-sm">{log.processNote}</p>
        </div>
      )}
    </div>
  );
}
