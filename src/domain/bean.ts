export function monthsSincePurchase(
  purchasedAt: string | null,
  today: Date,
): number | null {
  if (purchasedAt === null) return null;
  const purchased = new Date(purchasedAt);
  if (Number.isNaN(purchased.getTime())) return null;
  return (
    (today.getFullYear() - purchased.getFullYear()) * 12 +
    (today.getMonth() - purchased.getMonth())
  );
}
