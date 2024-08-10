import { ObjectId, Document } from "bson";
import { LocalStorageDb, MinimongoDb } from "minimongo";
import DbInterface from "./DbInterface";
import Collections from "./Collections";

export default class MiniMongoInterface implements DbInterface {
  db: MinimongoDb | undefined;

  init(): Promise<void>
  {
    this.db = new LocalStorageDb({}, console.log, console.error);

    for (const collectionName in Collections)
    {
      this.db.addCollection(collectionName);
    }

    return Promise.resolve();
  }

  addObject<Type>(collection: Collections, object: any): Promise<Type>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.upsert(object);
      return Promise.resolve(object as Type);
    }

    return Promise.reject("Collection not found: " + collection);
  }

  deleteObjectById(collection: Collections, id: ObjectId): Promise<void>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.remove(id.toHexString());
      return Promise.resolve();
    }

    return Promise.reject("Collection not found: " + collection);
  }

  updateObjectById<Type>(collection: Collections, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      foundCollection.upsert({ _id: id.toHexString(), ...newValues });
      return Promise.resolve();
    }

    return Promise.reject("Collection not found: " + collection);
  }

  findObjectById<Type>(collection: Collections, id: ObjectId): Promise<Type>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      return Promise.resolve(foundCollection.findOne(id.toHexString()) as Type);
    }

    return Promise.reject("Collection not found: " + collection);
  }

  findObject<Type extends Document>(collection: Collections, query: object): Promise<Type | undefined | null>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      const foundObj = foundCollection.findOne(query);
      return Promise.resolve(foundObj);
    }

    return Promise.reject("Collection not found: " + collection);
  }
  
  findObjects<Type>(collection: Collections, query: object): Promise<Type[]>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      return foundCollection.find(query).fetch();
    }

    return Promise.reject("Collection not found: " + collection);
  }

  countObjects<Type>(collection: Collections, query: object): Promise<number | undefined>
  {
    const foundCollection = this.db?.collections[collection];

    if (foundCollection)
    {
      return Promise.resolve(foundCollection.find(query).fetch().then((objs) => objs.length));
    }

    return Promise.reject("Collection not found: " + collection);
  }
  
}