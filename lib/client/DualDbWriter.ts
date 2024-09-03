import { ObjectId } from "bson";
import ClientAPI from "./ClientAPI";
import CollectionId from "./CollectionId";
import DbInterface from "./DbInterface";
import MiniMongoInterface from "./MiniMongoInterface";
import { useState, useEffect } from "react";

/**
 * A partial DbInterface that writes to LocalStorage and the server DB (through the API).
 */
export default class DualDbWriter implements Partial<DbInterface> {
  db: MiniMongoInterface;
  api: ClientAPI;

  constructor() {
    this.db = new MiniMongoInterface();
    this.db.init();

    this.api = new ClientAPI("gearboxiscool");
  }

  updateObjectById<Type>(collection: CollectionId, id: ObjectId, newValues: Partial<Type>): Promise<void>
  {
    this.db.updateObjectById(collection, id, newValues);
    return this.api.update(collection, id, newValues);
  }
}

export function useDbWriter() {
  const [writer, setWriter] = useState<DualDbWriter>();

  useEffect(() => {
    const newDb = new DualDbWriter();
    
    setWriter(newDb);
  }, []);

  return writer;
}