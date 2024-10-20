import { ObjectId, Document } from "bson";
import CollectionId from "../CollectionId";

export default interface DbInterface {
  init(): Promise<void>;
  addObject<Type extends Document>(collection: CollectionId, object: any): Promise<Type>;
  deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>;
  updateObjectById<Type extends Document>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>;
  findObjectById<Type extends Document>(collection: CollectionId, id: ObjectId): Promise<Type | undefined | null>;
  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined | null>;
  findObjects<Type extends Document>(collection: CollectionId, query: object): Promise<Type[]>;
  countObjects(collection: CollectionId, query: object): Promise<number | undefined>;
}