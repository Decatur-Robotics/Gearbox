import { Document, ObjectId } from "bson";
import CollectionId from "../CollectionId";
import DbInterface from "./DbInterface";
import { NoReaderError, UnsupportedOperationError } from "./DbInterfaceErrors";

/**
 * A partial DbInterface that reflects all write operations to multiple DbInterfaces.
 * 
 * @tested_by MultiDbInterface.test.ts
 */
export class MultiDbInterface implements DbInterface {
  writers: Partial<DbInterface>[];
  reader?: DbInterface;

  constructor(writers: Partial<DbInterface>[], reader?: DbInterface) {
    this.writers = writers;
    this.reader = reader;
  }

  async init() {
    const promises = this.writers.map(writer => writer.init?.());
    if (this.reader) promises.push(this.reader.init?.());

    await Promise.all(promises);
  }

  addObject<Type extends Document>(collection: CollectionId, object: any): Promise<Type>
  {
    const promises = this.writers.map(writer => writer.addObject?.(collection, object));
    return Promise.all(promises).then(() => object as Type);
  }

  deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>
  {
    const promises = this.writers.map(writer => writer.deleteObjectById?.(collection, id));
    return Promise.all(promises).then(() => undefined); // Return undefined to match the Promise<void> return type
  }

  updateObjectById<Type extends Document>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    const promises = this.writers.map(writer => writer.updateObjectById?.(collection, id, newValues));
    return Promise.all(promises).then(() => undefined);
  }

  findObjectById<Type extends Document>(collection: CollectionId, id: ObjectId): Promise<Type | undefined | null>
  {
    if (this.reader) {
      if (this.reader.findObjectById) return this.reader.findObjectById(collection, id);
      throw new UnsupportedOperationError("findObjectById");
    }
    throw new NoReaderError("findObjectById");
  }

  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined | null>
  {
    if (this.reader) {
      if (this.reader.findObject) return this.reader.findObject(collection, query);
      throw new UnsupportedOperationError("findObject");
    }
    throw new NoReaderError("findObject");
  }

  findObjects<Type extends Document>(collection: CollectionId, query: object): Promise<Type[]>
  {
    if (this.reader) {
      if (this.reader.findObjects) return this.reader.findObjects(collection, query);
      throw new UnsupportedOperationError("findObjects");
    }
    throw new NoReaderError("findObjects");
  }

  countObjects(collection: CollectionId, query: object): Promise<number | undefined>
  {
    if (this.reader) {
      if (this.reader.countObjects) return this.reader.countObjects(collection, query);
      throw new UnsupportedOperationError("countObjects");
    }
    throw new NoReaderError("countObjects");
  }
}