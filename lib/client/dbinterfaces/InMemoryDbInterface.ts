import { Document, EJSON, ObjectId } from "bson";
import CollectionId, { CollectionIdToType } from "@/lib/client/CollectionId";
import DbInterface, {
	WithStringOrObjectIdId,
} from "@/lib/client/dbinterfaces/DbInterface";
import { MemoryDb } from "minimongo";

/**
 * Remove undefined values or EJSON will convert them to null
 */
function removeUndefinedValues(obj: { [key: string]: any }): {
	[key: string]: any;
} {
	const newObj = { ...obj };

	for (const key in newObj) {
		if (newObj[key] === undefined) {
			delete newObj[key];
		} else if (Array.isArray(newObj[key])) {
			newObj[key] = newObj[key].map((item: any) => {
				if (typeof item === "object") {
					return removeUndefinedValues(item);
				}
				return item;
			});
		} else if (
			newObj[key] !== undefined &&
			!(newObj[key] instanceof ObjectId) &&
			newObj[key] !== null &&
			typeof newObj[key] === "object"
		) {
			newObj[key] = removeUndefinedValues(newObj[key]);
		}
	}

	return newObj;
}

function replaceOidOperator(
	obj: { [key: string]: any },
	idsToString: boolean,
): { [key: string]: any } {
	const newObj = { ...obj };

	for (const key in newObj) {
		if (idsToString && key === "_id") {
			newObj["_id"] = newObj._id.$oid;
		} else if (!idsToString && key === "_id") {
			newObj._id = new ObjectId(newObj._id.toString());
		} else if (Array.isArray(newObj[key])) {
			newObj[key] = newObj[key].map((item: any) => {
				if (typeof item === "object") {
					return replaceOidOperator(item, idsToString);
				}
				return item;
			});
		} else if (
			newObj[key] !== undefined &&
			!(newObj[key] instanceof ObjectId) &&
			newObj[key] !== null &&
			typeof newObj[key] === "object"
		) {
			newObj[key] = replaceOidOperator(newObj[key], idsToString);
		}
	}

	return newObj;
}

/**
 * @param removeUndefined pass false if you're serializing a query where undefined values are important
 * (this is most of the time that you're serializing a query)
 */
function serialize(obj: any, removeUndefined: boolean = true): any {
	return replaceOidOperator(
		EJSON.serialize(removeUndefined ? removeUndefinedValues(obj) : obj),
		true,
	);
}

function deserialize(obj: any): any {
	return replaceOidOperator(EJSON.deserialize(obj), false);
}

/**
 * @tested_by tests/lib/client/dbinterfaces/InMemoryDbInterface.test.ts
 */
export default class InMemoryDbInterface implements DbInterface {
	backingDb: MemoryDb;

	constructor() {
		this.backingDb = new MemoryDb();
	}

	init(): Promise<void> {
		const promise = new Promise((resolve) => {
			let collectionsCreated = 0;

			function onCollectionCreated() {
				collectionsCreated++;
				if (collectionsCreated === Object.keys(CollectionId).length) {
					resolve(undefined);
				}
			}

			// Have to use Object.values here or else we'll get the keys as strings
			// Be sure to use of, not in!
			for (const collectionId of Object.values(CollectionId)) {
				this.backingDb.addCollection(
					collectionId,
					onCollectionCreated,
					onCollectionCreated,
				);
			}
		});

		return promise as Promise<void>;
	}

	addObject<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj> {
		if (!object._id) object._id = new ObjectId();

		return this.backingDb.collections[collection]
			.upsert(serialize(object))
			.then(deserialize);
	}

	deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void> {
		return this.backingDb.collections[collection].remove(
			serialize({ _id: id }),
		);
	}

	updateObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId, newValues: Partial<TObj>): Promise<void> {
		return this.backingDb.collections[collection]
			.findOne(serialize({ _id: id }))
			.then((existingDoc) => {
				if (!existingDoc) {
					throw new Error(
						`Document with id ${id} not found in collection ${collection}`,
					);
				}

				const returnValue = this.backingDb.collections[collection].upsert(
					serialize({ ...existingDoc, ...newValues, _id: id }),
				);
				return deserialize(returnValue);
			});
	}

	findObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId): Promise<TObj | undefined> {
		return this.findObject(collection, { _id: id });
	}

	findObject<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		query: object,
	): Promise<TObj | undefined> {
		return this.backingDb.collections[collection]
			.findOne(serialize(query, false))
			.then(deserialize)
			.then((obj: TObj) => {
				if (Object.keys(obj).length === 0) {
					return undefined;
				}

				return obj;
			});
	}

	findObjects<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		query: object,
	): Promise<TObj[]> {
		return this.backingDb.collections[collection]
			.find(serialize(query, false))
			.fetch()
			.then((res: { [index: string]: object }) => {
				return Object.values(res).map(deserialize);
			});
	}

	countObjects(
		collection: CollectionId,
		query: object,
	): Promise<number | undefined> {
		return (
			this.backingDb.collections[collection]
				.find(serialize(query, false))
				.fetch() as Promise<unknown>
		).then((objects) => {
			return Object.keys(objects as any).length;
		});
	}
}
