import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { Competition } from "@/lib/Types";
import { BiExport } from "react-icons/bi";
import { MdAutoGraph, MdQueryStats, MdCoPresent } from "react-icons/md";

export default function CompHeaderCard({
	comp,
}: {
	comp: Competition | undefined;
}) {
	return (
		<div className="w-full card bg-base-200 shadow-xl">
			<div className="card-body">
				<div className="flex flex-row items-center justify-between w-full">
					<h1 className="card-title text-3xl font-bold">{comp?.name}</h1>
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
				</div>
			</div>
		</div>
	);
}
