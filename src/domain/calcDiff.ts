import { calcWeightLossRate } from "@/domain/roastLog";
import type { RoastLog } from "@/schemas/roastLog";

export interface RoastLogDiff {
  firstCrackDiffSec: number | null;
  secondCrackDiffSec: number | null;
  weightLossRateDiffPct: number | null;
  overallScoreDiff: number | null;
  outdoorTempDiff: number | null;
  indoorTempDiff: number | null;
}

function diffNullable(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null) return null;
  return current - previous;
}

export function calcDiff(current: RoastLog, previous: RoastLog): RoastLogDiff {
  return {
    firstCrackDiffSec: diffNullable(
      current.firstCrackSec,
      previous.firstCrackSec,
    ),
    secondCrackDiffSec: diffNullable(
      current.secondCrackSec,
      previous.secondCrackSec,
    ),
    weightLossRateDiffPct:
      calcWeightLossRate(current.weightBeforeG, current.weightAfterG) -
      calcWeightLossRate(previous.weightBeforeG, previous.weightAfterG),
    overallScoreDiff: diffNullable(current.overallScore, previous.overallScore),
    outdoorTempDiff: diffNullable(current.outdoorTempC, previous.outdoorTempC),
    indoorTempDiff: diffNullable(current.indoorTempC, previous.indoorTempC),
  };
}
