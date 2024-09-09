import CollectionId from "@/lib/client/CollectionId";
import { getDatabase } from "@/lib/MongoDB";

const collections: Partial<{ [collection in CollectionId]: <T>(obj: T) => T }> = {
  [CollectionId.Users]: <User>(obj: User) => {
    return obj;
  }
};

async function convertStringIdsIntoObjectIds() {
  console.log("Converting string IDs into ObjectIDs...");

  console.log("Getting database...");
  const db = await getDatabase();

  for (const collection in collections) {
    console.log("Finding objects in", collection);
    const objects = await db.findObjects(collection as CollectionId, {});

    console.log(`Converting ${objects.length} objects in ${collection}...`);

    for (const obj of objects) {
      console.log("Processing", obj._id, "in", collection);
      const newObj = collections[collection as CollectionId]?.(obj);
      if (newObj)
        await db.updateObjectById(collection as CollectionId, obj._id, newObj);
    }
  }
}

convertStringIdsIntoObjectIds();