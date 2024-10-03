/**
 * Utility Functions
 * @remarks
 * This is a general collection of commonly used functions
 */

import { removeWhitespaceAndMakeLowerCase } from "./client/ClientUtils";
import { Collections, getDatabase } from "./MongoDB";

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
  const db = getDatabase();

  var finalName;
  if (index === 0) {
    finalName = removeWhitespaceAndMakeLowerCase(name);
  } else {
    finalName = name + index.toString();
  }

  var result = await (await db).findObject(collection, { slug: finalName });
  if (result) {
    return GenerateSlug(collection, index === 0 ? finalName : name, index + 1);
  }

  return finalName;
}
