import Container from "@/components/Container";
import CollectionId from "@/lib/client/CollectionId";
import LocalStorageDbInterface from "@/lib/client/dbinterfaces/LocalStorageDbInterface";
import { ObjectId } from "bson";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LocalStorageDb() {
	const [db, setDb] = useState<LocalStorageDbInterface>();
	const [collection, setCollection] = useState<CollectionId>();
	const [json, setJson] = useState<string>();

	const [dbData, setDbData] = useState<{ [collection: string]: object[] }>({});
	const [flagCount, setFlagCount] = useState(0);

	useEffect(() => {
		const db = new LocalStorageDbInterface();
		db.init().then(() => {
			setDb(db);
			updateDbData(db);
		});
	}, []);

	async function updateDbData(db: LocalStorageDbInterface) {
		if (!db) return;

		const newDbData: { [collection: string]: object[] } = {};
		await Promise.all(
			Object.values(CollectionId).map(async (collection) => {
				const objects = await db.findObjects(collection, {});
				newDbData[collection] = objects;
			}),
		);
		setDbData(newDbData);

		const flaggedDocs: object[] = (
			await Promise.all(
				Object.values(CollectionId).map(
					async (collection) =>
						await db.findObjects(collection, { flagged: true }),
				),
			)
		).flat();
		setFlagCount(flaggedDocs.length);
	}

	async function addObject() {
		if (!db || !collection || !json) return;

		const obj = JSON.parse(json);

		console.log("Adding object", obj, "to", collection);

		try {
			await db.addObject(collection, obj);
		} catch (e: any) {
			toast.error(e.message);
		}
		updateDbData(db);
	}

	async function deleteObject(collection: CollectionId, _id: ObjectId) {
		if (!db) return;

		console.log("Deleting object", _id.toString(), "from", collection);

		await db.deleteObjectById(collection, _id);
		updateDbData(db);
	}

	async function increment(collection: CollectionId, _id: ObjectId) {
		if (!db) return;

		console.log("Incrementing object", _id.toString(), "in", collection);

		const object = await db.findObjectById(collection, _id);

		if (!object) {
			toast.error("Object not found:" + _id.toString());
			return;
		}

		await db.updateObjectById(collection, _id, {
			count: (object.count ?? 0) + 1,
		});

		updateDbData(db);
	}

	async function toggleFlag(collection: CollectionId, _id: ObjectId) {
		if (!db) return;

		console.log("Toggling flag on object", _id.toString(), "in", collection);

		const object = await db.findObjectById(collection, _id);

		if (!object) {
			toast.error("Object not found:" + _id.toString());
			return;
		}

		await db.updateObjectById(collection, _id, {
			flagged: !object.flagged,
		});

		updateDbData(db);
	}

	return (
		<Container
			requireAuthentication={false}
			title={"LocalStorage DB"}
		>
			<h1 className="text-xl">LocalStorage DB</h1>
			<div className="flex flex-col">
				<select
					onChange={(e) => setCollection(e.target.value as CollectionId)}
					defaultValue={"Select Collection"}
				>
					<option disabled>Select Collection</option>
					{Object.keys(CollectionId).map((collection) => (
						<option key={collection}>{collection}</option>
					))}
				</select>
				<textarea
					onChange={(e) => setJson(e.target.value)}
					placeholder="Enter JSON..."
				/>
				<button
					onClick={addObject}
					className="btn btn-primary"
				>
					Add Object
				</button>
			</div>
			<div className="divider" />
			<div>
				DB:{" "}
				{db ? (
					<span className="text-success">Ready</span>
				) : (
					<span className="text-error">Not ready</span>
				)}
			</div>
			<div>Flagged docs: {flagCount}</div>
			<div className="divider" />
			<ul>
				{db &&
					Object.values(CollectionId).map((collection) => (
						<li key={collection}>
							<h2>{collection}</h2>
							<ol className="ml-4">
								{dbData[collection] &&
									dbData[collection].map((object) => (
										<li
											key={JSON.stringify(object)}
											className="flex items-center"
										>
											<div>{JSON.stringify(object)}</div>
											<button
												className="btn btn-warning btn-sm"
												onClick={() =>
													deleteObject(collection, (object as any)._id)
												}
											>
												Delete
											</button>
											<button
												className="btn btn-secondary btn-sm"
												onClick={() =>
													increment(collection, (object as any)._id)
												}
											>
												Increment
											</button>
											<button
												className="btn btn-secondary btn-sm"
												onClick={() =>
													toggleFlag(collection, (object as any)._id)
												}
											>
												{(object as any).flagged ? "Unflag" : "Flag"}
											</button>
										</li>
									))}
							</ol>
						</li>
					))}
			</ul>
		</Container>
	);
}
