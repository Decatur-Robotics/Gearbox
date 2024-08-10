import { ObjectId, Document } from "bson";
import { LocalStorageDb, MinimongoDb } from "minimongo";
import DbInterface from "./DbInterface";
import CollectionId from "./CollectionId";
import { useState, useEffect } from "react";

export default class MiniMongoInterface implements DbInterface {
  db: MinimongoDb | undefined;

  init(): Promise<void>
  {
    this.db = new LocalStorageDb(
      {}, 
      () => console.log("MiniMongo DB initialized"), 
      (err: unknown) => console.error("MiniMongo DB failed to initialize:", err)
    );

    for (const collectionName in CollectionId)
    {
      this.db.addCollection(collectionName);
    }

    return Promise.resolve();
  }

  addObject<Type>(collection: CollectionId, object: any): Promise<Type>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.upsert(object);
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
      return Promise.resolve();
    }

    return Promise.reject("Collection not found: " + collection);
  }

  updateObjectById<Type>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.upsert({ _id: id.toHexString(), ...newValues });
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

export function useLocalDb(): MiniMongoInterface | undefined
{
  const [db, setDb] = useState<MiniMongoInterface>();

  useEffect(() => {
    const db = new MiniMongoInterface();
    db.init().then(() => setDb(db));
  }, []);

  return db;
}