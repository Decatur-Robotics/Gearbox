/**
 * Utility Functions
 * @remarks
 * This is a general collection of commonly used functions
 */
import { removeWhitespaceAndMakeLowerCase } from "./client/ClientUtils";
import CollectionId from "./client/CollectionId";
import DbInterface from "./client/dbinterfaces/DbInterface";
import { Redirect } from "next";

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
  db: DbInterface,
  collection: CollectionId,
  name: string,
  index: number = 0,
): Promise<string> {
  let finalName;
  if (index === 0) {
    finalName = removeWhitespaceAndMakeLowerCase(name);
  } else {
    finalName = name + index.toString();
  }

  const result = await db.findObject(collection, { slug: finalName });
  if (result) {
    return GenerateSlug(db, collection, index === 0 ? finalName : name, index + 1);
  }

  return finalName;
}

export function createRedirect(destination: string, query: Record<string, any> = {}): { redirect: Redirect } {
  return { 
    redirect: {
      destination: `${destination}?${Object.keys(query).map((key) => `${key}=${query[key]}`).join("&")}`,
      permanent: false,
    }
  };
}

export function isDeveloper(email: string | undefined) {
  return (JSON.parse(process.env.DEVELOPER_EMAILS) as string[]).includes(email ?? "");
}