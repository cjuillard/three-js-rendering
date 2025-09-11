/**
 * Maps a value from one range to another.
 * @param {*} value - The value to map inside the input range.
 * @param {*} min1 - The minimum of the input range.
 * @param {*} max1 - The maximum of the input range.
 * @param {*} min2 - The minimum of the output range.
 * @param {*} max2 - The maximum of the output range.
 * @returns The mapped value.
 */
export function map(value, min1, max1, min2, max2) {
  const ratio = (value - min1) / (max1 - min1);
  return min2 + ratio * (max2 - min2);
}

export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
