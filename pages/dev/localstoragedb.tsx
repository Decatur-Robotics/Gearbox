import Container from "@/components/Container";
import CollectionId from "@/lib/client/CollectionId";
import LocalStorageDbInterface from "@/lib/client/dbinterfaces/LocalStorageDbInterface";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LocalStorageDb() {
	const [db, setDb] = useState<LocalStorageDbInterface>();
	const [collection, setCollection] = useState<CollectionId>();
	const [json, setJson] = useState<string>();

	const [dbData, setDbData] = useState<{ [collection: string]: object[] }>({});

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
	}

	function addObject() {
		if (!db || !collection || !json) return;
		try {
			db.addObject(collection, JSON.parse(json));
		} catch (e: any) {
			toast.error(e.message);
		}
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
			<ul>
				{db &&
					Object.values(CollectionId).map((collection) => (
						<li key={collection}>
							<h2>{collection}</h2>
							<ol className="ml-4">
								{dbData[collection] &&
									dbData[collection].map((object) => (
										<li key={JSON.stringify(object)}>
											{JSON.stringify(object)}
										</li>
									))}
							</ol>
						</li>
					))}
			</ul>
		</Container>
	);
}
