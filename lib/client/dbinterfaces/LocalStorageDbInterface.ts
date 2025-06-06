import { ObjectId } from "bson";
import CollectionId, {
	CollectionIdToType,
	SluggedCollectionId,
} from "@/lib/client/CollectionId";
import DbInterface, {
	WithStringOrObjectIdId,
} from "@/lib/client/dbinterfaces/DbInterface";
import { default as BaseLocalStorageDbInterface } from "mongo-anywhere/LocalStorageDbInterface";
import findObjectBySlugLookUp from "@/lib/slugToId";

export default class LocalStorageDbInterface
	extends BaseLocalStorageDbInterface<
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

	findObjectBySlug<
		TId extends SluggedCollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, slug: string): Promise<TObj | undefined> {
		return findObjectBySlugLookUp(this, collection, slug);
	}

	addOrUpdateObject<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(collection: TId, object: TObj): Promise<TObj> {
		return super.addOrUpdateObject(collection, object);
	}
}
