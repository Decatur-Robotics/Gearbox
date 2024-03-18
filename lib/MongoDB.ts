import { Db, GridFSBucket, MongoClient, MongoClientOptions, ObjectId } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = { maxPoolSize: 3};

let client;
let clientPromise: Promise<MongoClient>;

if (!global.clientPromise) {
  client = new MongoClient(uri, options);
  global.clientPromise = client.connect();
}
clientPromise = global.clientPromise;

export { clientPromise };

export enum Collections {
  Seasons = "Seasons",
  Competitions = "Competitions",
  Matches = "Matches",
  Reports = "Reports",
  Teams = "Teams",
  Users = "users",
  Accounts = "accounts",
  Sessions = "sessions",
  Forms = "Forms",
  Pitreports = "Pitreports"
}

export async function GetDatabase(): Promise<MongoDBInterface> {
  if (!global.interface) {
    await clientPromise;
    const dbInterface = new MongoDBInterface(clientPromise);
    await dbInterface.init();
    global.interface = dbInterface;

    return dbInterface;
  }

  return global.interface;
}

export class MongoDBInterface {
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
        Object.values(Collections).forEach(
          async (collectionName) =>
            await this.db?.createCollection(collectionName),
        );
      } catch (e) {
        console.log("Failed to create collections... (probably exist already)");
      }
    }
  }

  async addObject<Type>(collection: Collections, object: any): Promise<Type> {
    const ack = await this?.db?.collection(collection).insertOne(object);
    object._id = ack?.insertedId;
    return object as Type;
  }

  async deleteObjectById(collection: Collections, id: ObjectId) {
    var query = { _id: id };
    await this?.db?.collection(collection).deleteOne(query);
  }

  async updateObjectById<Type>(
    collection: Collections,
    id: ObjectId,
    newValues: object,
  ): Promise<Type> {
    var query = { _id: id };
    var updated = { $set: newValues };
    return (await this?.db
      ?.collection(collection)
      .updateOne(query, updated)) as Type;
  }

  async findObjectById<Type>(
    collection: Collections,
    id: ObjectId,
  ): Promise<Type> {
    var query = { _id: id };
    return (await this?.db?.collection(collection).findOne(query)) as Type;
  }

  async findObject<Type>(
    collection: Collections,
    query: object,
  ): Promise<Type> {
    return (await this?.db?.collection(collection).findOne(query)) as Type;
  }

  async findObjects<Type>(
    collection: Collections,
    query: object,
  ): Promise<Type[]> {
    return (await this?.db
      ?.collection(collection)
      .find(query)
      .toArray()) as Type[];
  }

  async countObjects(collection: Collections, query: object): Promise<number | undefined> {
    return await this?.db?.collection(collection).countDocuments(query);
  }
}
