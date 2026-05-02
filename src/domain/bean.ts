export function monthsSincePurchase(
  purchasedAt: string | null,
  today: Date,
): number | null {
  if (purchasedAt === null) return null;
  const m = purchasedAt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const purchased = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return (
    (today.getFullYear() - purchased.getFullYear()) * 12 +
    (today.getMonth() - purchased.getMonth())
  );
}
