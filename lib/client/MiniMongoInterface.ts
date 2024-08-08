import { ObjectId, Document, Filter } from "mongodb";
import { Collections } from "../MongoDB";
import DbInterface from "./DbInterface";

export default class MiniMongoInterface implements DbInterface {
  init(): Promise<void>
  {
    throw new Error("Method not implemented.");
  }
  addObject<Type>(collection: Collections, object: any): Promise<Type>
  {
    throw new Error("Method not implemented.");
  }
  deleteObjectById(collection: Collections, id: ObjectId): Promise<void>
  {
    throw new Error("Method not implemented.");
  }
  updateObjectById<Type>(collection: Collections, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    throw new Error("Method not implemented.");
  }
  findObjectById<Type>(collection: Collections, id: ObjectId): Promise<Type>
  {
    throw new Error("Method not implemented.");
  }
  findObject<Type extends Document>(collection: Collections, query: Filter<Type>): Promise<Type | undefined | null>
  {
    throw new Error("Method not implemented.");
  }
  findObjects<Type>(collection: Collections, query: Filter<Type>): Promise<Type[]>
  {
    throw new Error("Method not implemented.");
  }
  countObjects<Type>(collection: Collections, query: Filter<Type>): Promise<number | undefined>
  {
    throw new Error("Method not implemented.");
  }
  
}