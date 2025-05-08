import { ObjectId, Document } from "bson";
import CollectionId, {
	CollectionIdToType,
	SluggedCollectionId,
} from "../CollectionId";
import { default as BaseDbInterface } from "mongo-anywhere/DbInterface";

export type WithStringOrObjectIdId<Type> = Omit<Type, "_id"> & {
	_id?: ObjectId | string;
};

export default interface DbInterface
	extends BaseDbInterface<CollectionId, CollectionIdToType<CollectionId>> {
	init(): Promise<void>;

	addObject<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj>;

	deleteObjectById(collection: CollectionId, id: ObjectId): Promise<void>;

	updateObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(
		collection: TId,
		id: ObjectId,
		newValues: Partial<TObj>,
	): Promise<void>;

	findObjectById<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(
		collection: TId,
		id: ObjectId,
	): Promise<TObj | undefined>;

	findObjectBySlug<
		TId extends SluggedCollectionId,
		TObj extends CollectionIdToType<TId>,
	>(
		collection: TId,
		slug: string,
	): Promise<TObj | undefined>;

	findObject<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		query: object,
	): Promise<TObj | undefined>;

	/**
	 * Type should not be an array! This function returns an array of Type (Type[]).
	 */
	findObjects<TId extends CollectionId, TObj extends CollectionIdToType<TId>>(
		collection: TId,
		query: object,
	): Promise<TObj[]>;

	countObjects(
		collection: CollectionId,
		query: object,
	): Promise<number | undefined>;

	addOrUpdateObject<
		TId extends CollectionId,
		TObj extends CollectionIdToType<TId>,
	>(
		collection: TId,
		object: TObj,
	): Promise<TObj>;
}
