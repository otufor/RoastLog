export function calcWeightLossRate(
  weightBeforeG: number,
  weightAfterG: number,
): number {
  if (weightBeforeG <= 0) return 0;
  return (1 - weightAfterG / weightBeforeG) * 100;
}

export function isCleanlinessWarning(cleanliness: number): boolean {
  return cleanliness <= 2;
}
