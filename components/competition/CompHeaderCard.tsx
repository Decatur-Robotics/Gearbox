import ClientApi from "@/lib/api/ClientApi";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { Competition, Match, Report } from "@/lib/Types";
import { useState } from "react";
import { BiExport } from "react-icons/bi";

import { FaCalendarDay } from "react-icons/fa";
import {
	MdAutoGraph,
	MdQueryStats,
	MdCoPresent,
	MdCloudSync,
} from "react-icons/md";
import ViewMatchesModal from "../ViewMatchesModal";
import { User } from "../../lib/Types";
import toast from "react-hot-toast";

const api = new ClientApi();

export default function CompHeaderCard({
	comp,
	matches,
	reports,
	user,
	matchPathway,
}: {
	comp: Competition | undefined;
	matches: Match[];
	reports: Report[];
	user: User | null;
	matchPathway: string;
}) {
	const [viewMatches, setViewMatches] = useState(false);

	async function toggleViewMatches() {
		setViewMatches(!viewMatches);
	}

	function syncComp() {
		if (!comp) return;

		const toastId = toast.loading("Syncing offline data...");

		new Promise(async () => {
			api.syncCompData(comp._id!.toString());

			const totalItemsToSync = comp?.pitReports.length || 0;
			let itemsSynced = 0;
			await Promise.all(
				comp?.pitReports.map(async (report) => {
					await fetch(`${location.href}/pit/${report}`);
					itemsSynced++;
					toast.loading(
						`Syncing offline data... (${itemsSynced}/${totalItemsToSync})`,
						{
							id: toastId,
						},
					);
				}),
			);

			console.log("Cached all pit reports");
			toast.success("Synced offline data!", { id: toastId });
		}).catch((err) =>
			toast.error(`Error syncing offline data. Error: ${err}`, {
				id: toastId,
			}),
		);
	}

	return (
		<div className="w-full card bg-base-200 shadow-xl">
			<div className="card-body">
				<div className="flex flex-row items-center justify-between w-full">
					<h1 className="card-title text-3xl font-bold">{comp?.name}</h1>
					<button
						onClick={syncComp}
						className="btn btn-ghost tooltip"
						data-tip="Sync Offline Data"
					>
						<MdCloudSync />
					</button>
				</div>
				<div className="divider"></div>
				<div className="w-full flex flex-col sm:flex-row items-center mt-4 max-sm:space-y-1">
					<a
						className={`max-sm:w-full btn btn-${comp?.tbaId !== NotLinkedToTba ? "primary" : "disabled"}`}
						href={"/event/" + comp?.tbaId}
					>
						Rankings <MdAutoGraph size={30} />
					</a>
					<div className="divider divider-horizontal"></div>
					<a
						className="max-sm:w-full btn btn-secondary"
						href={`${comp?.slug}/stats`}
					>
						Stats <MdQueryStats size={30} />
					</a>
					<div className="divider divider-horizontal"></div>
					<a
						className="max-sm:w-full btn btn-accent"
						href={`${comp?.slug}/pitstats`}
					>
						Pit Stats <MdCoPresent size={30} />
					</a>
					<div className="divider divider-horizontal"></div>
					<button
						className="max-sm:w-full btn btn-primary"
						onClick={toggleViewMatches}
					>
						My Matches <FaCalendarDay size={30} />
					</button>
				</div>
			</div>
			{viewMatches && user && (
				<ViewMatchesModal
					close={toggleViewMatches}
					matches={matches}
					reports={reports}
					user={user}
					matchPathway={matchPathway}
				/>
			)}
		</div>
	);
}
