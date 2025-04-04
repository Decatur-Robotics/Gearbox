import { Match, Report } from "@/lib/Types";
import Card from "./Card";
import { User } from "../lib/Types";
import { match } from "assert";
import { report } from "process";
import Checkbox from "./forms/Checkboxes";
import { CheckmarkIcon } from "react-hot-toast";
import { useState } from "react";

type MatchData = {
	number: number;
	url: string;
	message: string;
	completed: boolean;
	subjective: boolean;
};

function ViewMatchCard(props: MatchData) {
	return (
		<Card title={"Match " + props.number}>
			{props.message}
			<a
				href={props.url}
				className={`btn btn-sm ${props.completed ? `btn-ghost` : props.subjective ? `btn-secondary` : `btn-primary`}`}
			>
				{props.completed ? "Submitted" : "Click to scout"}
			</a>
		</Card>
	);
}
export default function ViewMatchesModal(props: {
	close: () => void;
	matches: Match[];
	reports: Report[];
	user: User;
	matchPathway: string;
}) {
	const reportsById: { [id: string]: Report } = {};
	const myMatches: MatchData[] = [];
	const [showSubmittedReports, setShowSubmittedReports] = useState(false);

	async function toggleShowSubmittedReports() {
		setShowSubmittedReports(!showSubmittedReports);
	}

	for (const report of props.reports) {
		reportsById[report._id?.toString()!] = report;
	}

	for (const match of props.matches) {
		if (match.subjectiveScouter == props.user._id?.toString()) {
			myMatches.push({
				number: match.number,
				url: props.matchPathway + `/${match._id}/subjective`,
				message: "You are subjective scouting match " + match.number + ".",
				completed: match.assignedSubjectiveScouterHasSubmitted,
				subjective: true,
			});
		}

		for (const report of match.reports) {
			if (reportsById[report]?.user == props.user._id?.toString()) {
				myMatches.push({
					number: match.number,
					url: props.matchPathway + `/${report.toString()}`,
					message:
						"You are scouting team " +
						reportsById[report].robotNumber +
						" in match " +
						match.number +
						".",
					completed: reportsById[report].submitted,
					subjective: false,
				});
			}
		}
	}

	return (
		<dialog
			open={true}
			className="modal"
		>
			<Card title="My Matches">
				<div className="absolute right-2 top-2 flex gap-4 items-center">
					<div className="flex gap-2">
						<div>Show Submitted Reports</div>
						<input
							type="checkbox"
							onChange={toggleShowSubmittedReports}
							className="checkbox checkbox-primary"
						/>
					</div>
					<button
						className="btn btn-sm btn-circle btn-ghost "
						onClick={props.close}
					>
						✕
					</button>
				</div>
				<div className="overflow-y-scroll h-[650px]">
					{myMatches
						.filter((matchData) => showSubmittedReports || !matchData.completed)
						.map((matchData) => (
							<ViewMatchCard {...matchData} />
						))}
				</div>
			</Card>
		</dialog>
	);
}
