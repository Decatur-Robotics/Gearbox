import CollectionId from './client/CollectionId';
import DbInterface from './client/DbInterface';
import {
  Db,
  Filter,
  MongoClient,
  MongoClientOptions,
  ObjectId,
  Document,
} from "mongodb";

if (!process.env.MONGODB_URI) {
  // Necessary to allow connections from files running outside of Next
  require("dotenv").config();

  if (!process.env.MONGODB_URI)
    console.error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const options: MongoClientOptions = { maxPoolSize: 3 };

let client;
let clientPromise: Promise<MongoClient>;

if (!global.clientPromise) {
  client = new MongoClient(uri, options);
  global.clientPromise = client.connect();
}
clientPromise = global.clientPromise;

export { clientPromise };

export async function getDatabase(): Promise<MongoDBInterface> {
  if (!global.interface) {
    await clientPromise;
    const dbInterface = new MongoDBInterface(clientPromise);
    await dbInterface.init();
    global.interface = dbInterface;

    return dbInterface;
  }

  return global.interface;
}

export class MongoDBInterface implements DbInterface {
  promise: Promise<MongoClient> | undefined;
  client: MongoClient | undefined;
  db: Db | undefined;

  constructor(promise: Promise<MongoClient>) {
    this.promise = promise;
  }

  async init() {
    this.client = await this.promise;
    this.db = this.client?.db(process.env.DB);
    //@ts-ignore

    const collections = await this.db?.listCollections().toArray();
    if (collections?.length === 0) {
      try {
        Object.values(CollectionId).forEach(
          async (collectionName) =>
            await this.db?.createCollection(collectionName)
        );
      } catch (e) {
        console.log("Failed to create collections... (probably exist already)");
      }
    }
  }

  async addObject<Type extends Document>(collection: CollectionId, object: any): Promise<Type> {
    const ack = await this?.db?.collection(collection).insertOne(object);
    object._id = ack?.insertedId;
    return object as Type;
  }

  async deleteObjectById(collection: CollectionId, id: ObjectId) {
    var query = { _id: id };
    await this?.db?.collection(collection).deleteOne(query);
  }

  async updateObjectById<Type extends Document>(
    collection: CollectionId,
    id: ObjectId,
    newValues: Partial<Type>
  ): Promise<void> {
    const query = { _id: id };
    var updated = { $set: newValues };
    this?.db
      ?.collection(collection)
      .updateOne(query, updated);
  }

  async findObjectById<Type extends Document>(
    collection: CollectionId,
    id: ObjectId
  ): Promise<Type | undefined | null> {
    var query = { _id: id };
    return (await this?.db?.collection(collection).findOne(query)) as Type | undefined | null;
  }

  async findObject<Type extends Document>(
    collection: CollectionId,
    query: object
  ): Promise<Type | undefined | null> {
    return (await this?.db?.collection(collection).findOne(query as Document)) as Type | undefined | null;
  }

  async findObjects<Type extends Document>(
    collection: CollectionId,
    query: object
  ): Promise<Type[]> {
    return (await this?.db
      ?.collection(collection)
      .find(query as Document)
      .toArray()) as unknown as Type[];
  }

  async countObjects(
    collection: CollectionId,
    query: object
  ): Promise<number | undefined> {
    return await this?.db?.collection(collection).countDocuments(query as Document);
  }
}
