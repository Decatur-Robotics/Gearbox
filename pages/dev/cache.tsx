import Container from "@/components/Container";
import ClientApi from "@/lib/api/ClientApi";
import CollectionId from "@/lib/client/CollectionId";
import useInterval from "@/lib/client/useInterval";
import { getCacheKey } from "mongo-anywhere/CachedDbInterface";
import { useCallback, useState } from "react";

const api = new ClientApi();

export default function Cache() {
	const [cacheStats, setCacheStats] = useState<object>();
	const [cachedVals, setCachedVals] = useState<
		{ key: string; val: object | undefined }[]
	>([]);

	const fetchCacheStats = useCallback(async () => {
		const stats = await api.getCacheStats();
		setCacheStats(stats);
	}, []);
	useInterval(fetchCacheStats, 1000);

	async function fetchCachedVal() {
		const method = (document.getElementById("method") as HTMLSelectElement)
			.value as "findOne" | "findMultiple" | "count";
		const collection = (
			document.getElementById("collection") as HTMLSelectElement
		).value as CollectionId;
		const query = (document.getElementById("query") as HTMLInputElement).value;

		const key = getCacheKey(method, collection, query);

		const val = await api.getCachedValue(key);
		setCachedVals((old) => [{ key, val }, ...old]); // Keep the most recent at the top
	}

	return (
		<Container
			title="Cache"
			requireAuthentication={true}
		>
			<h1 className="text-xl">Cache</h1>
			{cacheStats ? (
				Object.entries(cacheStats).map(([key, value]) => (
					<div key={key}>
						{key}: {(+value).toLocaleString()}
					</div>
				))
			) : (
				<div>No cache.</div>
			)}
			<div>
				<div className="flex">
					<select
						id="method"
						defaultValue="findOne"
					>
						{["findOne", "findMultiple", "count"].map((key: string) => (
							<option
								key={key}
								value={key}
							>
								{key}
							</option>
						))}
					</select>
					<select
						id="collection"
						defaultValue="Select Collection"
					>
						<option disabled>Select Collection</option>
						{Object.values(CollectionId).map((key: string) => (
							<option
								key={key}
								value={key}
							>
								{key}
							</option>
						))}
					</select>
					<input
						className="input input-bordered"
						type="text"
						id="query"
						placeholder="Query"
					/>
					<button
						className="btn btn-primary"
						onClick={fetchCachedVal}
					>
						Fetch
					</button>
				</div>
				{cachedVals.map(({ key, val }) => (
					<div key={key}>
						<h2 className="text-accent text-sm">{key}</h2>
						<p className="ml-4 text-sm">{val ? JSON.stringify(val) : val}</p>
					</div>
				))}
			</div>
		</Container>
	);
}
