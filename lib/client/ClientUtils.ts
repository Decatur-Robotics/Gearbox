export function getIdsInProgressFromTimestamps(timestamps: { [id: string]: string }) {
  const now = Date.now();
  return Object.keys(timestamps).filter((id) => {
    const timestamp = timestamps[id];
    return ((now - new Date(timestamp).getTime()) / 1000) < 10;
  });
}

export const NotLinkedToTba = "not-linked";

export function camelCaseToTitleCase(str: string) {
  if (typeof str !== "string") return "";

  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

/**
 * Shortcut for process.env.NEXT_PUBLIC_FORCE_OFFLINE_MODE === "true"
 * @returns true if the .env is set to force offline mode
 */
export function forceOfflineMode() {
  return process.env.NEXT_PUBLIC_FORCE_OFFLINE_MODE === "true";
}