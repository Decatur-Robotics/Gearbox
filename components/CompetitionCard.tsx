import { Competition, Team } from "@/lib/Types";
import Card from "./Card";
import { DateString, MonthString } from "@/lib/client/FormatTime";
import Loading from "./Loading";

export default function CompetitionCard(props: {
	comp: Competition | undefined;
}) {
	const comp = props.comp;
	if (!comp) {
		return <Loading></Loading>;
	}

	const n = Date.now();
	const live = comp.start < n && n < comp.end;
	const passed = n > comp.end;
	const coming = n < comp.start;
	return (
		<Card
			title={comp?.name}
			key={comp?._id}
			className="w-full bg-base-300 border-4 border-base-300 transition ease-in hover:border-primary"
		>
			{passed ? <div className="badge badge-neutral">Event Passed</div> : <></>}
			{live ? (
				<div className="badge badge-success animate-pulse">Live</div>
			) : (
				<></>
			)}
			{coming ? <div className="badge badge-accent">Incoming</div> : <></>}
			<div className="divider my-1"></div>
			<h1 className="font-semibold text-neutral-content max-sm:text-xs">
				{MonthString(comp.start)} - {MonthString(comp.end)}
			</h1>
		</Card>
	);
}
