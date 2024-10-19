import CollectionId from "@/lib/client/CollectionId";
import TestDbInterface from "@/lib/testutils/TestDbInterface";
import { EJSON, ObjectId } from "bson";

async function getDb() {
  const db = new TestDbInterface();
  await db.init();
  return db;
}

test(`${TestDbInterface.name}.${TestDbInterface.prototype.init.name}: Creates collections`, async () => {
  const db = await getDb();
  expect(db.backingDb.collections).toBeTruthy();

  for (const collectionId of Object.values(CollectionId)) {
    expect(db.backingDb.collections[collectionId]).toBeTruthy();
  }
});

test(`${TestDbInterface.name}.${TestDbInterface.prototype.addObject.name}: Adds object`, async () => {
  const db = await getDb();
  const object = { _id: new ObjectId(), name: "Test User" };
  await db.addObject(CollectionId.Users, object);
  expect(await db.countObjects(CollectionId.Users, {})).toBe(1);
});

test(`${TestDbInterface.name}.${TestDbInterface.prototype.deleteObjectById.name}: Deletes object by id`, async () => {
  const db = await getDb();
  const object = { _id: new ObjectId(), name: "Test User" };
  await db.addObject(CollectionId.Users, object);

  await db.deleteObjectById(CollectionId.Users, object._id);
  expect(await db.countObjects(CollectionId.Users, {})).toBe(0);
});

test(`${TestDbInterface.name}.${TestDbInterface.prototype.updateObjectById.name}: Updates object`, async () => {
  const db = await getDb();

  const object = { _id: new ObjectId(), name: "Test User", number: 1 };
  await db.addObject(CollectionId.Users, object);

  const updated = { name: "Updated User" };
  console.log("Current Doc:", await db.findObjectById(CollectionId.Users, object._id));
  await db.updateObjectById(CollectionId.Users, object._id, updated);
  console.log("Updated Doc:", await db.findObjectById(CollectionId.Users, object._id));
  console.log(await db.findObjectById(CollectionId.Users, object._id));
  expect(await db.findObjectById(CollectionId.Users, object._id)).toStrictEqual({ ...object, ...updated });
});

test(`${TestDbInterface.name}.${TestDbInterface.prototype.findObjectById.name}: Finds object by id`, async () => {
  const db = await getDb();

  const object = { _id: new ObjectId(), name: "Test User" };
  await db.addObject(CollectionId.Users, object);

  expect(await db.findObjectById(CollectionId.Users, object._id)).toStrictEqual(object);
});

test(`${TestDbInterface.name}.${TestDbInterface.prototype.findObject.name}: Finds object by query`, async () => {
  const db = await getDb();
  const object = { _id: new ObjectId(), name: "Test User" };
  await db.addObject(CollectionId.Users, object);
  expect(await db.findObject(CollectionId.Users, { name: object.name })).toStrictEqual(object);
});

test(`${TestDbInterface.name}.${TestDbInterface.prototype.countObjects.name}: Counts objects`, async () => {
  const db = await getDb();
  expect(await db.countObjects(CollectionId.Users, {})).toBe(0);

  await db.addObject(CollectionId.Users, { _id: new ObjectId(), name: "Test User" });
  expect(await db.countObjects(CollectionId.Users, {})).toBe(1);
});