/**
 * @tested_by tests/lib/api/ClientApiUtils.test.ts
 */
import { ObjectId } from "bson";
import CollectionId, { CollectionIdToType } from "../client/CollectionId";
import DbInterface from "../client/dbinterfaces/DbInterface";

export async function saveObjectAfterResponse<
	TId extends CollectionId,
	TObj extends CollectionIdToType<TId>,
>(
	{ dbPromise }: { dbPromise: Promise<DbInterface> },
	collectionid: TId,
	object: TObj | (TObj | undefined)[] | undefined,
	ranFallback: boolean,
) {
	if (ranFallback) return;

	const db = await dbPromise;

	if (Array.isArray(object))
		await Promise.all(
			object
				.filter((obj) => obj !== undefined)
				.map((obj) => db.addOrUpdateObject(collectionid, obj!)),
		);
	else if (object) await db.addOrUpdateObject(collectionid, object);
}

type AllowUndefinedIfNotArray<TArr, TEle> = TArr extends any[]
	? TEle[]
	: TEle | undefined;

export async function findObjectByIdFallback<
	TCollectionId extends CollectionId,
	TIdArg extends string | string[],
	TObj extends AllowUndefinedIfNotArray<
		TIdArg,
		CollectionIdToType<TCollectionId>
	>,
>(
	{ dbPromise }: { dbPromise: Promise<DbInterface> },
	collectionId: TCollectionId,
	id: TIdArg,
): Promise<TObj> {
	const db = await dbPromise;
	if (Array.isArray(id)) {
		return db.findObjects(collectionId, {
			_id: { $in: id.map((i) => new ObjectId(i)) },
		}) as Promise<TObj>;
	}
	return db.findObjectById(collectionId, new ObjectId(id)) as Promise<TObj>;
}
