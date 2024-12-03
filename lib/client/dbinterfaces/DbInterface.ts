import { ObjectId, Document } from "bson";
import CollectionId, { CollectionIdToType } from "../CollectionId";

export type WithStringOrObjectIdId<Type> = Omit<Type, "_id"> & { _id?: ObjectId | string };

export default interface DbInterface {
  init(): Promise<void>;
  addObject<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(collection: TId, object: WithStringOrObjectIdId<TObj>): Promise<TObj>;
  deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>;
  updateObjectById<Type extends Document>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>;
  findObjectById<Type extends Document>(collection: CollectionId, id: ObjectId): Promise<Type | undefined>;
  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined>;
  /**
   * Type should not be an array! This function returns an array of Type (Type[]).
   */
  findObjects<Type extends Document>(collection: CollectionId, query: object): Promise<Type[]>;
  countObjects(collection: CollectionId, query: object): Promise<number | undefined>;
}