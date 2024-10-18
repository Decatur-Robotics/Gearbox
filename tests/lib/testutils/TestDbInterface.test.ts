import CollectionId from "@/lib/client/CollectionId";
import TestDbInterface from "@/lib/testutils/TestDbInterface";
import { EJSON, ObjectId } from "bson";

async function getDb() {
  const db = new TestDbInterface();
  await db.init();
  return db;
}

test(`${TestDbInterface.name}.${TestDbInterface.prototype.init.name}: Creates Collections`, async () => {
  const db = await getDb();
  expect(db.backingDb.collections).toBeTruthy();

  for (const collectionId of Object.values(CollectionId)) {
    expect(db.backingDb.collections[collectionId]).toBeTruthy();
  }
});

test(`${TestDbInterface.name}.${TestDbInterface.prototype.addObject.name}: Adds Object`, async () => {
  const db = await getDb();
  const object = { _id: new ObjectId(), name: "Test User" };
  const inserted = EJSON.deserialize(await db.addObject(CollectionId.Users, object));
  // Use toStrictEqual to compare ObjectIds, not toBe
  expect(inserted).toStrictEqual(object);
});