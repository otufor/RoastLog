import { useNavigate } from "@tanstack/react-router";
import { DiffSummary } from "@/components/DiffSummary";
import { StarRating } from "@/components/StarRating";
import { calcWeightLossRate } from "@/domain/roastLog";
import { useBeans } from "@/hooks/useBeans";
import { useFlavorTags } from "@/hooks/useFlavorTags";
import { useDeleteRoastLog } from "@/hooks/useMutateRoastLog";
import { useRoastDevices } from "@/hooks/useRoastDevices";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { usePreviousRoastLog, useRoastLog } from "@/hooks/useRoastLogs";
import { weatherEmoji } from "@/lib/weatherEmoji";

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
  const { data: flavorTags = [], isLoading: flavorTagsLoading } =
    useFlavorTags();
  const { data: previousLog, isLoading: previousLogLoading } =
    usePreviousRoastLog(logId, log?.beanId ?? null);
  const { mutateAsync: deleteLog } = useDeleteRoastLog();

  if (
    logLoading ||
    beansLoading ||
    levelsLoading ||
    devicesLoading ||
    flavorTagsLoading ||
    previousLogLoading
  )
    return null;
  if (!log) return <p>ログが見つかりません</p>;

  const bean = beans.find((b) => b.id === log.beanId);
  const level = levels.find((l) => l.id === log.roastLevelId);
  const device = devices.find((d) => d.id === log.roastDeviceId);
  const rate = calcWeightLossRate(log.weightBeforeG, log.weightAfterG);
  const flavorTagMap = Object.fromEntries(flavorTags.map((t) => [t.id, t]));
  const tasting = log.tasting;

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

        <dt className="text-muted-foreground">天気</dt>
        <dd>
          <span role="img" aria-label="天気">
            {weatherEmoji(log.weatherCode) || "—"}
          </span>
        </dd>

        <dt className="text-muted-foreground">外気温</dt>
        <dd>{log.outdoorTempC != null ? `${log.outdoorTempC}℃` : "—"}</dd>

        <dt className="text-muted-foreground">外気湿度</dt>
        <dd>{log.outdoorHumidity != null ? `${log.outdoorHumidity}%` : "—"}</dd>
      </dl>

      {log.processNote && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">焙煎メモ</p>
          <p className="text-sm">{log.processNote}</p>
        </div>
      )}

      {/* 総合評価 */}
      {log.overallScore != null && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">総合評価</p>
          <StarRating value={log.overallScore} size={18} />
        </div>
      )}

      {previousLog && <DiffSummary current={log} previous={previousLog} />}

      {/* テイスティング */}
      {tasting && (
        <div className="border-t pt-4 flex flex-col gap-3">
          <p className="text-sm font-medium">テイスティング</p>

          {tasting.flavorTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tasting.flavorTags.map((tagId) => {
                const tag = flavorTagMap[tagId];
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: `${tag.color}1A`,
                      color: tag.color,
                      border: `0.5px solid ${tag.color}66`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: tag.color }}
                    />
                    {tag.name}
                  </span>
                );
              })}
            </div>
          )}

          <dl className="flex flex-col gap-2">
            {(
              [
                { key: "sweetness", label: "甘さ" },
                { key: "acidity", label: "酸味" },
                { key: "body", label: "コク" },
                { key: "bitterness", label: "苦み" },
                { key: "aftertaste", label: "後味" },
                { key: "cleanliness", label: "クリーン" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd>
                  <StarRating value={tasting[key]} size={14} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
