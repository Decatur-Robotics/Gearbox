import { Db, MongoClient, MongoClientOptions } from "mongodb";
import { ObjectId, Document } from "bson";
import CollectionId, {
	CollectionIdToType,
	SluggedCollectionId,
} from "./client/CollectionId";
import DbInterface, {
	WithStringOrObjectIdId,
} from "./client/dbinterfaces/DbInterface";
import { default as BaseMongoDbInterface } from "mongo-anywhere/MongoDbInterface";
import CachedDbInterface from "./client/dbinterfaces/CachedDbInterface";
import { cacheOptions } from "./client/dbinterfaces/CachedDbInterface";
import { findObjectBySlugLookUp } from "./slugToId";

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

export async function getDatabase(
	useCache: boolean = true,
): Promise<DbInterface> {
	if (!global.interface) {
		await clientPromise;

		const mongo = new MongoDBInterface(clientPromise);

		const dbInterface = useCache
			? new CachedDbInterface(mongo, cacheOptions)
			: mongo;
		await dbInterface.init();
		global.interface = dbInterface;

		return dbInterface;
	}

	return global.interface;
}

export class MongoDBInterface
	extends BaseMongoDbInterface<CollectionId, CollectionIdToType<CollectionId>>
	implements DbInterface
{
	async init() {
		super.init(Object.values(CollectionId));
	}

	async addObject<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, object: WithStringOrObjectIdId<TObj>): Promise<TObj> {
		return super.addObject(collection, object);
	}

	async deleteObjectById(collection: CollectionId, id: ObjectId) {
		await this?.db?.collection(collection).deleteOne({ _id: id });
	}

	updateObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId, newValues: Partial<TObj>): Promise<void> {
		return super.updateObjectById(collection, id, newValues);
	}

	async findObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId): Promise<TObj> {
		return super.findObjectById(collection, id);
	}

	async findObject<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, query: object): Promise<TObj> {
		return super.findObject(collection, query);
	}

	async findObjects<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, query: object): Promise<TObj[]> {
		return super.findObjects(collection, query);
	}

	async countObjects(
		collection: CollectionId,
		query: object,
	): Promise<number | undefined> {
		return super.countObjects(collection, query);
	}

	findObjectBySlug<
		TId extends SluggedCollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, slug: string): Promise<TObj | undefined> {
		return findObjectBySlugLookUp(this, collection, slug);
	}
}
