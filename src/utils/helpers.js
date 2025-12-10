export const formatDateForAPI = (date) => {
  if (!date) return null;
  return date.toISOString().split("T")[0];
};

export function formatTime(time) {
  if (!time) return "--:--";

  // Jika string "HH:MM"
  if (typeof time === "string" && time.includes(":")) {
    return time;
  }

  // Jika Date object
  if (time instanceof Date) {
    const h = String(time.getHours()).padStart(2, "0");
    const m = String(time.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }

  return "--:--";
}
