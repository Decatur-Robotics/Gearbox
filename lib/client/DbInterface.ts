import { ObjectId, Document } from "bson";
import { Collections } from "../MongoDB";
// import type tells TS to remove the import from the compiled JS, letting us use server types on the client
import type { Filter } from "mongodb";

export default interface DbInterface {
  init(): Promise<void>;
  addObject<Type>(collection: Collections, object: any): Promise<Type>;
  deleteObjectById(collection: Collections, id: ObjectId): Promise<void>;
  updateObjectById<Type>(collection: Collections, id: ObjectId, newValues: Partial<Type>): Promise<void>;
  findObjectById<Type>(collection: Collections, id: ObjectId): Promise<Type>;
  findObject<Type extends Document>(collection: Collections, query: Filter<Type>): Promise<Type | undefined | null>;
  findObjects<Type>(collection: Collections, query: Filter<Type>): Promise<Type[]>;
  countObjects<Type>(collection: Collections, query: Filter<Type>): Promise<number | undefined>;
}