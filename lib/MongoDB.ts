import { Db, MongoClient, MongoClientOptions } from "mongodb";
import { ObjectId, Document } from "bson";
import CollectionId, { CollectionIdToType } from "./client/CollectionId";
import DbInterface, {
	WithStringOrObjectIdId,
} from "./client/dbinterfaces/DbInterface";

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

		const CollectionId = (await this.db
			?.listCollections()
			.toArray()) as CollectionId;
		if (CollectionId?.length === 0) {
			try {
				Object.values(CollectionId).forEach(
					async (collectionName) =>
						await this.db?.createCollection(collectionName),
				);
			} catch (e) {
				console.log(
					"Failed to create CollectionId... (probably exist already)",
				);
			}
		}
	}

	async addObject<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, object: WithStringOrObjectIdId<TObj>): Promise<TObj> {
		if (object._id && typeof object._id === "string")
			object._id = new ObjectId(object._id);

		const ack = await this?.db
			?.collection(collection)
			.insertOne(object as Document & { _id?: ObjectId });
		object._id = ack?.insertedId;
		return object as TObj;
	}

	async deleteObjectById(collection: CollectionId, id: ObjectId) {
		var query = { _id: id };
		await this?.db?.collection(collection).deleteOne(query);
	}

	updateObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId, newValues: Partial<TObj>): Promise<void> {
		var query = { _id: id };
		var updated = { $set: newValues };
		this?.db?.collection(collection).updateOne(query, updated);

		return Promise.resolve();
	}

	async findObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId): Promise<TObj> {
		return (await this?.db
			?.collection(collection)
			.findOne({ _id: id })) as TObj;
	}

	async findObject<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, query: object): Promise<TObj> {
		return (await this?.db?.collection(collection).findOne(query)) as TObj;
	}

	async findObjects<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, query: object): Promise<TObj[]> {
		return (await this?.db
			?.collection(collection)
			.find(query)
			.toArray()) as TObj[];
	}

	async countObjects(
		collection: CollectionId,
		query: object,
	): Promise<number | undefined> {
		return await this?.db?.collection(collection).countDocuments(query);
	}
}
