import { calcDiff } from "@/domain/calcDiff";
import type { RoastLog } from "@/schemas/roastLog";

interface DiffSummaryProps {
  current: RoastLog;
  previous: RoastLog;
}

function formatSecDiff(sec: number | null): string {
  if (sec === null) return "—";
  const sign = sec > 0 ? "+" : "";
  return `${sign}${sec}秒`;
}

function formatNumberDiff(n: number | null, suffix: string): string {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}${suffix}`;
}

function formatRateDiff(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}pt`;
}

export function DiffSummary({ current, previous }: DiffSummaryProps) {
  const diff = calcDiff(current, previous);

  return (
    <section
      className="border-t pt-4 flex flex-col gap-2"
      aria-labelledby="diff-summary-heading"
    >
      <h2 id="diff-summary-heading" className="text-sm font-medium">
        前回ログとの差分
      </h2>
      <p className="text-xs text-muted-foreground">
        前回焙煎日: {previous.roastDate}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">1ハゼ差</dt>
        <dd>{formatSecDiff(diff.firstCrackDiffSec)}</dd>

        <dt className="text-muted-foreground">2ハゼ差</dt>
        <dd>{formatSecDiff(diff.secondCrackDiffSec)}</dd>

        <dt className="text-muted-foreground">重量減少率差</dt>
        <dd>
          {diff.weightLossRateDiffPct === null
            ? "—"
            : formatRateDiff(diff.weightLossRateDiffPct)}
        </dd>

        <dt className="text-muted-foreground">総合評価差</dt>
        <dd>{formatNumberDiff(diff.overallScoreDiff, "")}</dd>

        <dt className="text-muted-foreground">外気温差</dt>
        <dd>{formatNumberDiff(diff.outdoorTempDiff, "℃")}</dd>

        <dt className="text-muted-foreground">室内気温差</dt>
        <dd>{formatNumberDiff(diff.indoorTempDiff, "℃")}</dd>
      </dl>
    </section>
  );
}
