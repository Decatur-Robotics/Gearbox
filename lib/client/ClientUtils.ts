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

/**
 * @param arr an array of objects with an _id field
 * @returns a dictionary of the array with the _id as the key
 */
export function toDict<TElement extends { _id: string | undefined }>(arr: TElement[]) {
  const dict: { [_id: string]: TElement } = {};

  arr.forEach((item) => {
    if (item._id) {
      dict[item._id] = item;
    }
  });

  return dict;
}

export function download(filename: string, content: string, type: string = "text/plain") {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Removes duplicate elements from an array. **Not in place.**
 * @param arr the arr to remove duplicates from. Flattens and recurses on the array.
 * @returns A new array with no duplicates.
 */
export function removeDuplicates(...arr: any[]) {
  arr = arr.map((a) => Array.isArray(a) ? removeDuplicates(...a) : a).flat();

  return Array.from(new Set(arr));
}