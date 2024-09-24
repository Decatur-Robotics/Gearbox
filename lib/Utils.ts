/**
 * Utility Functions
 * @remarks
 * This is a general collection of commonly used functions
 */

import { Collections, getDatabase } from "./MongoDB";

// get the database for some functions that use it
const db = getDatabase();

/**
 * Removes whitespace from a string
 * @param str - The string to remove whitespace from
 * @returns - A "filtered" string
 * @tested_by Utils.test.ts
 */
export function removeWhitespace(str: string): string {
  return str.replace(/\s/g, "").toLowerCase();
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
    finalName = removeWhitespace(name);
  } else {
    finalName = name + index.toString();
  }

  var result = await (await db).findObject(collection, { slug: finalName });
  if (result) {
    return GenerateSlug(collection, index === 0 ? finalName : name, index + 1);
  }

  return finalName;
}
