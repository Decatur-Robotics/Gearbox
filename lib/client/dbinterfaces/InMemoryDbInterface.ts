import { Document, EJSON, ObjectId } from "bson";
import CollectionId, { CollectionIdToType } from "@/lib/client/CollectionId";
import DbInterface, {
	WithStringOrObjectIdId,
} from "@/lib/client/dbinterfaces/DbInterface";
import { MemoryDb } from "minimongo";
import { default as BaseInMemoryDbInterface } from "mongo-anywhere/InMemoryDbInterface";
import { Col } from "react-bootstrap";

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
export default class InMemoryDbInterface
	extends BaseInMemoryDbInterface<
		CollectionId,
		CollectionIdToType<CollectionId>
	>
	implements DbInterface
{
	init(): Promise<void> {
		return super.init(Object.values(CollectionId));
	}
	addObject<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj> {
		return super.addObject(collection, object);
	}
	deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void> {
		return super.deleteObjectById(collection, id);
	}
	updateObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId, newValues: Partial<TObj>): Promise<void> {
		return super.updateObjectById(collection, id, newValues);
	}
	findObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, id: ObjectId): Promise<TObj | undefined> {
		return super.findObjectById(collection, id);
	}
	findObject<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		query: object,
	): Promise<TObj | undefined> {
		return super.findObject(collection, query);
	}
	findObjects<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		query: object,
	): Promise<TObj[]> {
		return super.findObjects(collection, query);
	}
	countObjects(
		collection: CollectionId,
		query: object,
	): Promise<number | undefined> {
		return super.countObjects(collection, query);
	}
}
