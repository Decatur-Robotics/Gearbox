import { ObjectId, Document, EJSON } from "bson";
import { LocalStorageDb, MinimongoCollection, MinimongoDb } from "minimongo";
import DbInterface from "./DbInterface";
import CollectionId from "./CollectionId";
import { useState, useEffect } from "react";

export default class MiniMongoInterface implements DbInterface {
  db: MinimongoDb | undefined;

  init(): Promise<void>
  {
    this.db = new LocalStorageDb(
      {}, 
      () => {},
      (err: unknown) => console.error("MiniMongo DB failed to initialize:", err)
    );

    for (const collectionName in CollectionId)
    {
      this.db.addCollection(collectionName);
      this.loadCollectionFromLocalStorage(collectionName as CollectionId);
    }

    return Promise.resolve();
  }

  private loadCollectionFromLocalStorage(collectionId: CollectionId) {
    const collection = this.db?.collections[collectionId];    
    if (!collection) {
      console.error("Collection not found during load: " + collectionId);
      return;
    }

    const objects = localStorage.getItem("db-" + collection.name) ?? "[]";
    const parsedObjects = EJSON.parse(objects) as unknown;

    if (!Array.isArray(parsedObjects))
      return;

    for (const obj of parsedObjects)
    {
      collection.upsert(obj);
    }
  }

  /**
   * Minimongo does not support saving collections to local storage out of the box.
   * You MUST call this method to save the collection or else your changes will not be saved!
   */
  private async saveCollection(collection: MinimongoCollection): Promise<void> {
    if (!collection)
      return Promise.reject("Collection not found during save");

    const objects = await collection.find({}).fetch();
    localStorage.setItem("db-" + collection.name, EJSON.stringify(objects));
  }

  private async performOperationOnCollection<Type>(operationName: string, collection: CollectionId, operation: (collection: MinimongoCollection) => Promise<Type>): Promise<Type>
  {
    const foundCollection = this.db?.collections[collection];

    if (!foundCollection)
      return Promise.resolve(undefined as Type);

    const operationReturn = operation(foundCollection);
    this.saveCollection(foundCollection);
    return Promise.resolve(operationReturn);
  }

  addObject<Type>(collection: CollectionId, object: any): Promise<Type>
  {
    return this.performOperationOnCollection("add", collection, (collection) => collection.upsert(object));
  }

  deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>
  {
    return this.performOperationOnCollection("delete", collection, (collection) => collection.remove(id.toHexString()));
  }

  updateObjectById<Type>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    return this.performOperationOnCollection("update", collection, (collection) => collection.upsert(id.toHexString(), newValues));
  }

  findObjectById<Type extends Document>(collection: CollectionId, id: ObjectId): Promise<Type | undefined | null>
  {
    return this.findObject(collection, { _id: id });
  }

  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined | null>
  {
    return this.performOperationOnCollection("find one", collection, (collection) => collection.findOne(query));
  }
  
  findObjects<Type>(collection: CollectionId, query: object): Promise<Type[]>
  {
    return this.performOperationOnCollection("find multiple", collection, (collection) => collection.find(query).fetch());
  }

  countObjects(collection: CollectionId, query: object): Promise<number | undefined>
  {
    return this.performOperationOnCollection("count", collection, (collection) => collection.find(query).fetch().then((objects) => objects.length));
  }  
}

export function useLocalDb() {
  const [db, setDb] = useState<MiniMongoInterface>();

  useEffect(() => {
    const newDb = new MiniMongoInterface();
    newDb.init(); // Remember to init!
    
    setDb(newDb);
  }, []);

  return db;
}