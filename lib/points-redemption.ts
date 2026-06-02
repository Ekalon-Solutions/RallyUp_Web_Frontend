export function canShowPointsRedemption(
  availablePoints: number | null,
  orderTotalBeforePoints: number
): boolean {
  return orderTotalBeforePoints > 0 && (availablePoints ?? 0) > 0
}

export function validatePointsRedemptionInput(
  pointsToRedeem: number | string,
  availablePoints: number | null,
  orderTotalBeforePoints: number
): string | null {
  const points = Number(pointsToRedeem)
  if (orderTotalBeforePoints <= 0) {
    return "Points cannot be applied when the order total is zero"
  }
  if (availablePoints !== null && availablePoints <= 0) {
    return "You have no points available to redeem"
  }
  if (!pointsToRedeem || !Number.isFinite(points) || points <= 0) {
    return "Enter points to redeem"
  }
  if (availablePoints !== null && points > availablePoints) {
    return "You do not have enough points"
  }
  return null
}
