/**
 * @tested_by tests/lib/api/ClientApiUtils.test.ts
 */
import { ObjectId } from "bson";
import CollectionId, {
	CollectionIdToType,
	SluggedCollectionId,
} from "../client/CollectionId";
import DbInterface from "../client/dbinterfaces/DbInterface";
import ClientApi from "./ClientApi";
import LocalStorageDbInterface from "../client/dbinterfaces/LocalStorageDbInterface";
import toast from "react-hot-toast";
import { Pitreport } from "../Types";

/**
 * Return true when the local object should be overwritten by the remote object.
 */
export const ShouldOverwrite = Object.freeze({
	PitReport: (local: Pitreport, remote: Pitreport) =>
		!local.submitted || remote.submitted,
});

/**
 * Checks if the local object should be overwritten by the remote object.
 * If yes, updates the local object in the database.
 */
async function updateIfShouldOverwrite<
	TId extends CollectionId,
	TObj extends CollectionIdToType<TId>,
>(
	db: DbInterface,
	collectionId: TId,
	remoteObject: TObj | undefined,
	shouldOverwrite?: (local: TObj, remote: TObj) => boolean,
): Promise<void> {
	if (!remoteObject) return;

	if (shouldOverwrite) {
		const localObject = await db.findObjectById(
			collectionId,
			new ObjectId(remoteObject._id),
		);

		if (localObject && !shouldOverwrite(localObject, remoteObject)) {
			return;
		}
	}

	await db.addOrUpdateObject(collectionId, remoteObject);
}

export async function saveObjectAfterResponse<
	TId extends CollectionId,
	TObj extends CollectionIdToType<TId>,
>(
	{ dbPromise }: { dbPromise: Promise<DbInterface> },
	collectionId: TId,
	object: TObj | (TObj | undefined)[] | undefined,
	ranFallback: boolean,
	shouldOverwrite?: (local: TObj, remote: TObj) => boolean,
) {
	if (ranFallback) return;

	const db = await dbPromise;

	if (Array.isArray(object))
		await Promise.all(
			object
				.filter((obj) => obj !== undefined)
				.map((obj) =>
					updateIfShouldOverwrite(db, collectionId, obj, shouldOverwrite),
				),
		);
	else if (object) {
		await updateIfShouldOverwrite(db, collectionId, object, shouldOverwrite);
	}
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

export async function findObjectBySlugFallback<
	TCollectionId extends SluggedCollectionId,
	TSlugArg extends string | string[],
	TObj extends AllowUndefinedIfNotArray<
		TSlugArg,
		CollectionIdToType<TCollectionId>
	>,
>(
	{ dbPromise }: { dbPromise: Promise<DbInterface> },
	collectionId: TCollectionId,
	slug: TSlugArg,
): Promise<TObj> {
	const db = await dbPromise;
	if (Array.isArray(slug)) {
		return Promise.all(
			slug.map((s) => db.findObjectBySlug(collectionId, s)),
		).then((objs) => objs.filter((obj) => obj != undefined)) as Promise<TObj>;
	}
	return db.findObjectBySlug(collectionId, slug) as Promise<TObj>;
}

export async function syncCompData(api: ClientApi, compId: string) {
	const toastId = toast.loading("Syncing offline data...");

	if (!window.navigator.onLine) {
		toast.error("Cannot sync offline data: No internet connection.", {
			id: toastId,
		});
		throw new Error("Cannot sync offline data: No internet connection.");
	}

	const comp = await api.findCompetitionById(compId).catch((err) => {
		toast.error("Error fetching competition: " + err, { id: toastId });
		throw new Error("Error fetching competition: " + err);
	});

	if (!comp) {
		toast.error("Competition not found: " + compId, { id: toastId });
		throw new Error("Competition not found: " + compId);
	}

	const localDb = new LocalStorageDbInterface();
	localDb.init();

	const totalItemsToSync = comp.pitReports.length;
	let itemsSynced = 0;

	const remotePitReportsById = (
		await api.findBulkPitReportsById(comp.pitReports)
	).reduce(
		(acc, report) => {
			acc[report._id!.toString()] = report;
			return acc;
		},
		{} as Record<string, CollectionIdToType<CollectionId.PitReports>>,
	);

	async function syncPitReport(pitReportId: string) {
		const localPitReport = await localDb.findObjectById(
			CollectionId.PitReports,
			new ObjectId(pitReportId),
		);

		if (!localPitReport) return;

		const remotePitReport = remotePitReportsById[pitReportId];

		if (
			localPitReport.submitted &&
			(!remotePitReport || !remotePitReport!.submitted)
		)
			await api.updatePitreport(pitReportId, localPitReport);
	}

	await Promise.all(
		comp.pitReports.map((report) =>
			syncPitReport(report).finally(() => {
				itemsSynced++;
				toast.loading(
					`Syncing offline data... (${itemsSynced}/${totalItemsToSync})`,
					{
						id: toastId,
					},
				);
			}),
		),
	);

	toast.success("Synced all offline data!", { id: toastId });
}
