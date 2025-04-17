import { ObjectId } from "bson";
import CollectionId, {
	CollectionIdToType,
	SluggedCollectionId,
} from "@/lib/client/CollectionId";
import DbInterface, {
	WithStringOrObjectIdId,
} from "@/lib/client/dbinterfaces/DbInterface";
import { default as BaseCachedDbInterface } from "mongo-anywhere/CachedDbInterface";
import NodeCache from "node-cache";
import { CacheOperation } from "mongo-anywhere/CachedDbInterface";
import { findObjectBySlugLookUp } from "@/lib/slugToId";

export const cacheOptions: NodeCache.Options = {
	stdTTL: 1 * 60,
	useClones: false,
};

export default class CachedDbInterface
	extends BaseCachedDbInterface<CollectionId, CollectionIdToType<CollectionId>>
	implements DbInterface
{
	init(): Promise<void> {
		return super.init(Object.values(CollectionId));
	}
	getTtl(operation: CacheOperation, collectionId: CollectionId): number {
		if (operation === "count") return 3 * 60 * 60;

		return cacheOptions.stdTTL!;
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

	findObjectBySlug<
		TId extends SluggedCollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, slug: string): Promise<TObj | undefined> {
		return findObjectBySlugLookUp(this, collection, slug);
	}

	addOrUpdateObject<TId extends CollectionId>(
		collection: TId,
		object: CollectionIdToType<TId>,
	): Promise<CollectionIdToType<TId>> {
		return super.addOrUpdateObject(collection, object);
	}

	findObjectAndUpdate<TId extends CollectionId>(
		collection: TId,
		id: ObjectId,
		newValues: Partial<CollectionIdToType<TId>>,
	): Promise<CollectionIdToType<TId> | undefined> {
		return super.findObjectAndUpdate(collection, id, newValues);
	}

	deleteObjects<TId extends CollectionId>(
		collection: TId,
		query: object,
	): Promise<void> {
		return super.deleteObjects(collection, query);
	}

	findObjectAndDelete<TId extends CollectionId>(
		collection: TId,
		query: object,
	): Promise<CollectionIdToType<TId> | undefined> {
		return super.findObjectAndDelete(collection, query);
	}
}
