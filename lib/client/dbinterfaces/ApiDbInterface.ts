import { Document, ObjectId } from 'bson';
import ClientAPI from '../ClientAPI';
import CollectionId from '../CollectionId';
import DbInterface from './DbInterface';

export default class ApiDbInterface implements Partial<DbInterface> {
  api: ClientAPI;

  constructor() {
    this.api = new ClientAPI("gearboxiscool");
  }

  updateObjectById<Type extends Document>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    return this.api.update(collection, id, newValues);
  }

  findObjectById<Type extends Document>(collection: CollectionId, id: ObjectId): Promise<Type | undefined | null>
  {
    return this.api.findOne(collection, { _id: id });
  }

  findObject<Type extends Document>(collection: CollectionId, query: object): Promise<Type | undefined | null>
  {
    return this.api.findOne(collection, query);
  }

  findObjects<Type extends Document>(collection: CollectionId, query: object): Promise<Type[]>
  {
    return this.api.findMultiple(collection, query);
  }
}