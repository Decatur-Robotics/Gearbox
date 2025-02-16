import Container from "@/components/Container";
import ClientApi from "@/lib/api/ClientApi";
import useInterval from "@/lib/client/useInterval";
import { useCallback, useState } from "react";

const api = new ClientApi();

export default function Cache() {
	const [cacheStats, setCacheStats] = useState<object>();

	const fetchCache = useCallback(async () => {
		const stats = await api.getCacheStats();
		setCacheStats(stats);
	}, []);
	useInterval(fetchCache, 1000);

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
		</Container>
	);
}
