/**
 * Centralized utility functions for handling dates, times, and countdowns.
 */

/**
 * Formats a duration in seconds into a string in 'hh:mm:ss' format.
 * @param seconds Number of seconds
 */
export const formatSecondsToHMS = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].join(':');
};

/**
 * Calculates remaining time until endTime and returns a Vietnamese formatted string.
 * @param endTimeStr ISO string representing the end time
 */
export const getRemainingTimeVi = (endTimeStr: string | undefined): string => {
  if (!endTimeStr) return "";
  const end = new Date(endTimeStr).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) {
    return "Đã hết giờ";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let str = "";
  if (hours > 0) {
    str += `${hours} giờ `;
  }
  if (minutes > 0 || hours > 0) {
    str += `${minutes} phút `;
  }
  str += `${seconds} giây`;
  return str.trim();
};
