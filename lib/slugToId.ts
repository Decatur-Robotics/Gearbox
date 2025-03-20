/**
 * @tested_by lib/slugToId.test.ts
 */
import { ObjectId } from "bson";
import CollectionId, {
	CollectionIdToType,
	SluggedCollectionId,
} from "./client/CollectionId";
import DbInterface from "./client/dbinterfaces/DbInterface";

declare global {
	var slugLookup: Map<CollectionId, Map<string, ObjectId>>;
}

function getSlugLookup() {
	if (!global.slugLookup) {
		global.slugLookup = new Map();
	}
	return global.slugLookup;
}

/**
 * You are probably looking for findObjectBySlugLookUp!
 */
export async function slugToId<TId extends SluggedCollectionId>(
	db: DbInterface | Promise<DbInterface>,
	collection: TId,
	slug: string,
): Promise<{
	id: ObjectId | undefined;
	object: CollectionIdToType<TId> | undefined;
}> {
	if (db instanceof Promise) {
		db = await db;
	}

	const slugLookup = getSlugLookup();

	let collectionSlugs = slugLookup.get(collection);
	if (!collectionSlugs) {
		collectionSlugs = new Map();
		slugLookup.set(collection, collectionSlugs);
	}

	if (!collectionSlugs.has(slug)) {
		const obj = await db.findObject(collection, { slug });
		if (!obj) {
			return { id: undefined, object: undefined };
		}
		collectionSlugs.set(slug, obj._id as ObjectId);
		return { id: obj._id as ObjectId, object: obj };
	}

	return { id: collectionSlugs.get(slug), object: undefined };
}

export default async function findObjectBySlugLookUp<
	TId extends SluggedCollectionId,
	TObj extends CollectionIdToType<TId>,
>(db: DbInterface, collection: TId, slug: string): Promise<TObj | undefined> {
	const { id, object } = await slugToId(db, collection, slug);
	if (!id) {
		return undefined;
	}

	if (object) {
		return object as TObj;
	}

	return await db.findObjectById(collection, id);
}
