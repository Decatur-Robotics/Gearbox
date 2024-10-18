import { Document, EJSON, ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import DbInterface from "../client/dbinterfaces/DbInterface";
import { MemoryDb } from "minimongo";

/**
* @tested_by tests/lib/testutils/TestDbInterface.test.ts
*/
export default class TestDbInterface implements DbInterface {
  backingDb: MemoryDb;

  constructor() {
    this.backingDb = new MemoryDb();
  }

  init(): Promise<void>
  {
    const promise = new Promise((resolve) => {
      let collectionsCreated = 0;

      function onCollectionCreated() {
        collectionsCreated++;
        if (collectionsCreated === Object.keys(CollectionId).length)
        {
          resolve(undefined);
        }
      }

      // Have to use Object.values here or else we'll get the keys as strings
      // Be sure to use of, not in!
      for (const collectionId of Object.values(CollectionId))
      {
        this.backingDb.addCollection(collectionId, onCollectionCreated, onCollectionCreated);
      }
    });

    return promise as Promise<void>;
  }

  addObject<Type extends Document>(collection: CollectionId, object: any): Promise<Type>
  {
    return this.backingDb.collections[collection].upsert(EJSON.serialize(object));
  }

  deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>
  {
    return this.backingDb.collections[collection].remove(id);
  }

  updateObjectById<Type extends Document>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    return this.backingDb.collections[collection].upsert(newValues);
  }

  findObjectById<Type extends Document>(collection: CollectionId, id: ObjectId): Promise<Type | undefined | null>
  {
    return this.backingDb.collections[collection].findOne(id);
  }

  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined | null>
  {
    return this.backingDb.collections[collection].findOne(query);
  }

  findObjects<Type extends Document>(collection: CollectionId, query: object): Promise<Type[]>
  {
    return this.backingDb.collections[collection].find(query).fetch();
  }

  countObjects(collection: CollectionId, query: object): Promise<number | undefined>
  {
    return this.backingDb.collections[collection].find(query).fetch().length;
  }
   
}