/**
 * Utility Functions
 * @remarks
 * This is a general collection of commoly used functions
 */

import { exec } from "child_process";
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

export async function getGitBranchName() {
  // Convert a callback into a promise
  return new Promise((resolve, reject) =>{
    exec("git rev-parse --abbrev-ref HEAD", (err, stdout, stderr) => {
      if (err)
        reject(err);
      else resolve(stdout);
    });
  });
}