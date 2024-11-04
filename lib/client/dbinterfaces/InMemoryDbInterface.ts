import { Document, EJSON, ObjectId } from "bson";
import CollectionId from "@/lib/client/CollectionId";
import DbInterface from "@/lib/client/dbinterfaces/DbInterface";
import { MemoryDb } from "minimongo";

function replaceOidOperator(obj: { [key: string]: any }, idsToString: boolean): { [key: string]: any } {
  const newObj = { ...obj };

  for (const key in newObj) {
    if (idsToString && key === "_id") {
      newObj["_id"] = newObj._id.$oid;
    } else if (!idsToString && key === "_id") {
      newObj._id = new ObjectId(newObj._id);
    } else if (Array.isArray(newObj[key])) {
      newObj[key] = newObj[key].map((item: any) => {
        if (typeof item === "object") {
          return replaceOidOperator(item, idsToString);
        }
        return item;
      });
    } else if (typeof newObj[key] === "object") {
      newObj[key] = replaceOidOperator(newObj[key], idsToString);
    } 
  }

  return newObj;
}

function serialize(obj: any): any {
  return replaceOidOperator(EJSON.serialize(obj), true);
}

function deserialize(obj: any): any {
  return replaceOidOperator(EJSON.deserialize(obj), false);
}

/**
* @tested_by tests/lib/client/dbinterfaces/InMemoryDbInterface.test.ts
*/
export default class InMemoryDbInterface implements DbInterface {
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
    if (!object._id)
      object._id = new ObjectId();

    return this.backingDb.collections[collection].upsert(serialize(object)).then(deserialize);
  }

  deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>
  {
    return this.backingDb.collections[collection].remove(serialize({ _id: id }));
  }

  updateObjectById<Type extends Document>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    return this.backingDb.collections[collection].findOne(serialize({ _id: id })).then((existingDoc) => {
      if (!existingDoc)
      {
        throw new Error(`Document with id ${id} not found in collection ${collection}`);
      }

      const returnValue = this.backingDb.collections[collection].upsert(serialize({ ...existingDoc, ...newValues, _id: id }));
      return deserialize(returnValue);
    })
  }

  findObjectById<Type extends Document>(collection: CollectionId, id: ObjectId): Promise<Type | undefined | null>
  {
    return this.findObject(collection, { _id: id });
  }

  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined | null>
  {
    return this.backingDb.collections[collection].findOne(serialize(query)).then(deserialize).then((obj: Type) => {
      if (Object.keys(obj).length === 0)
      {
        return undefined;
      }

      return obj;
    });
  }

  findObjects<Type extends Document>(collection: CollectionId, query: object): Promise<Type[]>
  {
    return this.backingDb.collections[collection].find(serialize(query)).fetch().then((res: { [index: string]: object }) => {
      return Object.values(res).map(deserialize);
    });
  }

  countObjects(collection: CollectionId, query: object): Promise<number | undefined>
  {
    return (this.backingDb.collections[collection].find(EJSON.serialize(query)).fetch() as Promise<unknown>)
              .then((objects) => {
                return Object.keys(objects as any).length;
              });
  }
   
}