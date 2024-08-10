import { ObjectId, Document } from "bson";
import Collections from "./Collections";

export default interface DbInterface {
  init(): Promise<void>;
  addObject<Type>(collection: Collections, object: any): Promise<Type>;
  deleteObjectById(collection: Collections, id: ObjectId): Promise<void>;
  updateObjectById<Type>(collection: Collections, id: ObjectId, newValues: Partial<Type>): Promise<void>;
  findObjectById<Type>(collection: Collections, id: ObjectId): Promise<Type>;
  findObject<Type extends Document>(collection: Collections, query: object): Promise<Type | undefined | null>;
  findObjects<Type extends Document>(collection: Collections, query: object): Promise<Type[]>;
  countObjects<Type extends Document>(collection: Collections, query: object): Promise<number | undefined>;
}