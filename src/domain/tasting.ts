import type { Tasting } from "@/schemas/roastLog";

export function validateTastingAxes(axes: (number | null)[]): boolean {
  const filled = axes.filter((v) => v !== null).length;
  return filled === 0 || filled === axes.length;
}

export function buildTasting(
  flavorTagIds: string[],
  sweetness: number | null,
  acidity: number | null,
  body: number | null,
  bitterness: number | null,
  aftertaste: number | null,
  cleanliness: number | null,
): Tasting | null {
  if (
    sweetness === null ||
    acidity === null ||
    body === null ||
    bitterness === null ||
    aftertaste === null ||
    cleanliness === null
  )
    return null;
  return {
    flavorTags: flavorTagIds,
    sweetness,
    acidity,
    body,
    bitterness,
    aftertaste,
    cleanliness,
  };
}
