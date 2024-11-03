export function getIdsInProgressFromTimestamps(timestamps: { [id: string]: string }) {
  const now = Date.now();
  return Object.keys(timestamps).filter((id) => {
    const timestamp = timestamps[id];
    return ((now - new Date(timestamp).getTime()) / 1000) < 10;
  });
}

export const NotLinkedToTba = "not-linked";

/**
 * @tested_by tests/lib/client/ClientUtils.test.ts
 */
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
 * @tested_by tests/lib/client/ClientUtils.test.ts
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
 * @tested_by tests/lib/client/ClientUtils.test.ts
 */
export function removeDuplicates(...arr: any[]) {
  arr = arr.map((a) => Array.isArray(a) ? removeDuplicates(...a) : a).flat();

  return Array.from(new Set(arr));
}

/**
 * Returns the value of a random array element
 * @param array - The array to use
 * @returns - A random value from the supplied array
 */
export function randomArrayValue(array: any[]): any {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffles an array in a random order
 * @param array - The array to shuffle
 * @returns - The shuffled array
 */
export function shuffleArray(array: any[]) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Circularly rotates an array to the left (first element goes to the end, the rest shift up by 1) **in place**
 * @param array - The array to rotate
 * @returns - The rotated array
 * @tested_by tests/lib/client/ClientUtils.test.ts
 */
export function rotateArray(array: any[]) {
  return array.push(array.shift());
}

/**
 * Gets around "... cannot be serialized as JSON" error by converting the object to a string and back to an object
 * 
 * @returns a clone of the object that is serializable
 */
export function makeObjSerializeable(obj: Object) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Removes whitespace from a string and makes it lower case.
 * @param str - The string to remove whitespace from
 * @returns - A "filtered" string
 * @tested_by tests/lib/client/ClientUtils.test.ts
 */
export function removeWhitespaceAndMakeLowerCase(str: string): string {
  return str.replace(/\s/g, "").toLowerCase();
}

/**
* @tested_by tests/lib/clien/tClientUtils.test.ts
*/
export function promisify<TReturn>(func: (...args: any[]) => TReturn): (...args: any[]) => Promise<TReturn> {
  return (...args: any[]) => 
    new Promise<TReturn>((resolve, reject) => {
      func(...args, (val: TReturn) => resolve(val), (err: any) => reject(err));
    });
}