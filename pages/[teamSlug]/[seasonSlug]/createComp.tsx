import { CompetitonNameIdPair as CompetitionNameIdPair } from "@/lib/Types";
import React, { useEffect, useState } from "react";

import ClientApi from "@/lib/api/ClientApi";
import UrlResolver, {
	ResolvedUrlData,
	serializeDatabaseObject,
} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { defaultGameId } from "@/lib/client/GameId";
import { Analytics } from "@/lib/client/Analytics";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useCallback } from "react";

const api = new ClientApi();

export default function CreateComp(props: ResolvedUrlData) {
	const { session } = useCurrentSession();

	const team = props.team;
	const season = props.season;

	const [name, setName] = useState<string>("");
	const [results, setResults] = useState<
		{ value: number; pair: CompetitionNameIdPair }[]
	>([]);
	const [selection, setSelection] = useState<number | undefined>();
	const [loading, setLoading] = useState(false);
	const [creatingComp, setCreatingComp] = useState(false);
	const [usePublicData, setUsePublicData] = useState(true);

	const searchComp = useCallback(async () => {
		if (!name) {
			return;
		}
		setLoading(true);
		setSelection(undefined);
		let data = await api.searchCompetitionByName(name);
		if (Object.keys(data).length === 0) {
			setResults([]);
		} else {
			setResults(data);
		}

		setLoading(false);
	}, [name]);

	const createComp = async () => {
		setCreatingComp(true);

		// Can't just do selection ? because 0 is a valid selection, but will evaluate to false
		const selectedId =
			selection !== undefined ? results[selection].pair.tbaId : undefined;
		const autofill = selectedId
			? await api.competitionAutofill(selectedId)
			: undefined;

		const now = new Date().getTime();

		const comp = await api.createCompetition(
			autofill?.tbaId ?? NotLinkedToTba,
			autofill?.start ?? now,
			autofill?.end ?? now,
			autofill?.name ?? name,
			season?._id!,
			usePublicData,
		);
		var win: Window = window;
		win.location = `/${team?.slug}/${season?.slug}/${comp.slug}`;

		Analytics.compCreated(
			comp.name,
			comp.gameId,
			usePublicData,
			team?.number ?? -1,
			session?.user?.name ?? "Unknown User",
		);
	};

	useEffect(() => {
		searchComp();
	}, [name, searchComp]);

	return (
		<Container
			requireAuthentication={true}
			hideMenu={false}
			title="Create Competition"
		>
			<Flex
				center={true}
				mode="col"
				className="w-full h-92 my-10"
			>
				<Card
					title={"Create Competition"}
					className="w-1/3"
				>
					<div>
						<h1>Search for a competition or enter details</h1>
						<div className="divider"></div>
						<input
							value={name}
							onChange={(e) => {
								setName(e.target.value);
							}}
							className="input input-bordered w-full mb-4"
							placeholder={"Competition Name"}
							disabled={creatingComp}
						/>
						<div className="w-full h-64 space-y-2 ">
							{loading || name.length < 3 ? (
								// <Loading></Loading>
								<></>
							) : (
								results.map((e, i) =>
									!creatingComp || i === selection ? (
										<h1
											key={e.pair.name}
											className={
												"bg-base-300 text-sm p-2 rounded-lg border-4 border-base-300 " +
												(selection === i
													? "border-primary"
													: "hover:border-primary")
											}
											onClick={() => {
												setSelection(i);
											}}
										>
											{e.pair.name}
										</h1>
									) : (
										<></>
									),
								)
							)}
						</div>
					</div>
					{creatingComp ? (
						<progress className="progress w-full" />
					) : (
						<div className="pt-4">
							{selection !== undefined && selection >= 0 && (
								<div className="flex flex-row justify-between pb-4">
									<div>
										<p className="text-2xl">Make data publicly available?</p>
										<p>
											Making your data publicly available helps smaller teams
											make informed decisions during alliance selection.
											Don&apos;t worry - no identifying information will be
											shared and comments will be hidden; only quantitative data
											will be shared.
											<br />
											This setting can be changed at any time.
										</p>
									</div>
									<input
										type="checkbox"
										className="toggle toggle-primary"
										id="toggle-public-data"
										defaultChecked={usePublicData}
										onChange={(e) => setUsePublicData(e.target.checked)}
									/>
								</div>
							)}
							<button
								className={`btn btn-${selection !== undefined && selection >= 0 ? "primary" : "warning"} w-full`}
								onClick={createComp}
							>
								Create Competition
								{selection === undefined || selection < 0
									? " (WARNING: TBA competition not linked. Some features will be unavailable)"
									: `: ${results[selection].pair.name} (TBA ID: ${results[selection].pair.tbaId})`}
							</button>
						</div>
					)}
				</Card>
			</Flex>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const resolved = await UrlResolver(context, 2);

	if ("redirect" in resolved) {
		return resolved;
	}

	return {
		props: {
			...resolved,
			season: serializeDatabaseObject(resolved.season),
		},
	};
};
