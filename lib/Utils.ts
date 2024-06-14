/**
 * Utility Functions
 * @remarks
 * This is a general collection of commoly used functions
 */

import { Collections, getDatabase } from "./MongoDB";

// get the database for some functions that use it
const db = getDatabase();

/**
 * Cleans all usernames/slugs of non-alphabetic characters
 * @param username - The name to filter
 * @returns - A "filtered" name
 */
export function CleanUsername(username: string): string {
  return username.replace(/\s/g, "").toLowerCase();
}

/**
 * Generates a SLUG from a supplied name- ensures it is unique
 *
 * @remarks
 * SLUG stands for Short URL, and is a human readable ID system we use
 * This function generally is ran when an object is added to the database
 *
 * @param collection - A Database Collection
 * @param name - The name that is the base of the generation
 * @param index - Number to append to end of name- works recursively
 * @returns - A Unique SLUG
 */
export async function GenerateSlug(
  collection: Collections,
  name: string,
  index: number = 0,
): Promise<string> {
  var finalName;
  if (index === 0) {
    finalName = CleanUsername(name);
  } else {
    finalName = name + index.toString();
  }

  var result = await (await db).findObject(collection, { slug: finalName });
  if (result) {
    return GenerateSlug(collection, index === 0 ? finalName : name, index + 1);
  }

  return finalName;
}

/**
 * Returns the value of a random array element
 * @param array - The array to use
 * @returns - A random value from the supplied array
 */
export function RandomArrayValue(array: any[]): any {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffles an array in a random order
 * @param array - The array to shuffle
 * @returns - The shuffled array
 */
export function ShuffleArray(array: any[]) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Circularly rotates an array (first element goes to the end, the rest shift up by 1)
 * @param array - The array to rotate
 * @returns - The rotated array
 */
export function RotateArray(array: any[]) {
  return array.push(array.shift());
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