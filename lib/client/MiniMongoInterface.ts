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
    if (!collection)
      return;

    const objects = localStorage.getItem("db-" + collection.name);
    if (objects)
    {
      const parsedObjects = EJSON.parse(objects) as unknown;

      if (!Array.isArray(parsedObjects))
        return;

      for (const obj of parsedObjects)
      {
        collection.upsert(obj);
      }
    }
  }

  /**
   * Minimongo does not support saving collections to local storage out of the box.
   * You MUST call this method to save the collection or else your changes will not be saved!
   */
  private async saveCollection(collection: MinimongoCollection): Promise<void> {
    if (!collection)
      return Promise.reject("Collection not found");

    const objects = await collection.find({}).fetch();
    localStorage.setItem("db-" + collection.name, EJSON.stringify(objects));
  }

  addObject<Type>(collection: CollectionId, object: any): Promise<Type>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.upsert(object);
      this.saveCollection(foundCollection);
      return Promise.resolve(object as Type);
    }

    return Promise.reject("Collection not found: " + collection);
  }

  deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.remove(id.toHexString());
      this.saveCollection(foundCollection);
      return Promise.resolve();
    }

    return Promise.reject("Collection not found: " + collection);
  }

  updateObjectById<Type>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.upsert({ _id: id, ...newValues });
      this.saveCollection(foundCollection);
      return Promise.resolve();
    }

    return Promise.reject("Collection not found: " + collection);
  }

  findObjectById<Type>(collection: CollectionId, id: ObjectId): Promise<Type>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      return Promise.resolve(foundCollection.findOne(id.toHexString()) as Type);
    }

    return Promise.reject("Collection not found: " + collection);
  }

  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined | null>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      const foundObj = foundCollection.findOne(query);
      return Promise.resolve(foundObj);
    }

    return Promise.reject("Collection not found: " + collection);
  }
  
  findObjects<Type>(collection: CollectionId, query: object): Promise<Type[]>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      return foundCollection.find(query).fetch();
    }

    return Promise.reject("Collection not found: " + collection);
  }

  countObjects(collection: CollectionId, query: object): Promise<number | undefined>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      return Promise.resolve(foundCollection.find(query).fetch().then((objs) => objs.length));
    }

    return Promise.reject("Collection not found: " + collection);
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