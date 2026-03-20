/**
 * Calculate the great-circle distance between two points
 * using the Haversine formula
 *
 * @returns Distance in kilometers
 */
export function getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Estimate delivery time based on distance
 *
 * @returns Time in minutes or null
 */
export const calculateDeliveryTime = (
    distanceKm: number | null | undefined
): number | null => {
    if (distanceKm === null || distanceKm === undefined) return null;

    const AVERAGE_SPEED_KMPH = 20;
    const HANDLING_TIME_MIN = 10;

    const travelTimeMin =
        (distanceKm / AVERAGE_SPEED_KMPH) * 60;

    return Math.ceil(travelTimeMin + HANDLING_TIME_MIN + 5);
};