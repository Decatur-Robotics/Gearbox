import { NumericalAverage, ComparativePercent } from "@/lib/client/StatsMath";
import {
	PitReportData,
	Pitreport,
	QuantData,
	Report,
	SubjectiveReport,
	SubjectiveReportSubmissionType,
} from "@/lib/Types";
import { PiCrosshair, PiGitFork } from "react-icons/pi";
import { FaCode, FaWifi } from "react-icons/fa6";
import { FaComment } from "react-icons/fa";
import { ReactNode, useEffect, useState } from "react";
import ClientApi from "@/lib/api/ClientApi";
import Loading from "../Loading";
import { StatsLayout, Stat, StatPair, Badge } from "@/lib/Layout";

const api = new ClientApi();

function Comment({ text, tooltip }: { text: string; tooltip?: string }) {
	return (
		<li
			className={`w-full break-words ml-2 -indent-2 text-wrap ${tooltip && "tooltip tooltip-right"} text-left`}
			data-tip={tooltip}
		>
			{text}
		</li>
	);
}

export default function TeamStats(props: {
	selectedTeam: number | undefined;
	selectedReports: Report[];
	pitReport: Pitreport | null;
	subjectiveReports: SubjectiveReport[];
	getBadges: (
		pitData: Pitreport<PitReportData> | undefined,
		quantitativeData: Report<QuantData>[],
		card: boolean,
	) => Badge[];
	layout: StatsLayout<PitReportData, QuantData>;
}) {
	const [comments, setComments] = useState<
		| {
				matchNum: number;
				content: { order: number; text: string; tooltip: string | undefined }[];
		  }[]
		| null
	>(null);

	const pitReport = props.pitReport;
	const badges = props.getBadges(
		pitReport ?? undefined,
		props.selectedReports,
		false,
	);

	useEffect(() => {
		if (!props.selectedTeam) return;
		setComments(null);

		const newComments: typeof comments = [];

		function addComment(
			match: number,
			order: number,
			text: string,
			tooltip: string | undefined = undefined,
		) {
			if (!newComments!.some((comment) => comment.matchNum === match))
				newComments!.push({
					matchNum: match,
					content: [
						{
							order,
							text,
							tooltip,
						},
					],
				});
			else
				newComments!
					.find((comment) => comment.matchNum === match)!
					.content.push({ order, text, tooltip });
		}

		if (pitReport)
			addComment(
				0,
				0,
				(pitReport.data?.comments.length ?? 0 > 0)
					? `Pit Report: ${pitReport.data?.comments}`
					: "No pit report comments.",
			);

		if (!props.subjectiveReports)
			addComment(0, 0.1, "Loading subjective reports...");
		else if (props.subjectiveReports.length === 0)
			addComment(0, 0.1, "No subjective reports.");
		else {
			for (const report of props.subjectiveReports) {
				const submissionType =
					(report.submitted === SubjectiveReportSubmissionType.ByAssignedScouter
						? "assigned"
						: report.submitted ===
							  SubjectiveReportSubmissionType.BySubjectiveScouter
							? "subjective"
							: "non-subjective") + " scouter";

				if (report.robotComments[props.selectedTeam ?? 0]) {
					addComment(
						report.matchNumber ?? 0,
						2,
						`Subjective: ${report.robotComments[props.selectedTeam ?? 0]}`,
						`By ${submissionType}`,
					);
				}

				if (report.wholeMatchComment) {
					addComment(
						report.matchNumber ?? 0,
						1,
						`Whole Match: ${report.wholeMatchComment}`,
						`By ${submissionType}`,
					);
				}
			}
		}

		const commentList =
			props.selectedReports?.filter(
				(report) => report.data?.comments.length > 0,
			) ?? [];
		// if (commentList.length === 0) return setComments(newComments);

		const promises = commentList.map((report) =>
			api
				.findMatchById(report.match)
				.then(
					(match) =>
						match &&
						addComment(
							match.number,
							0,
							`Quantitative: ${report.data?.comments}`,
						),
				),
		);

		Promise.all(promises).then(() => {
			const sortedComments = newComments.sort(
				(a, b) => a.matchNum - b.matchNum,
			);
			setComments(sortedComments);
		});
	}, [
		props.selectedTeam,
		props.selectedReports,
		props.subjectiveReports,
		props.pitReport,
		pitReport,
	]);

	if (!props.selectedTeam) {
		return (
			<div className="w-full sm:w-2/5 h-[700px] flex flex-col items-center justify-center bg-base-200">
				<h1 className="text-3xl text-accent animate-bounce font-semibold">
					Select A Team
				</h1>
			</div>
		);
	}

	function getSections(
		header: string,
		stats: (
			| Stat<PitReportData, QuantData>
			| StatPair<PitReportData, QuantData>
		)[],
	) {
		const statElements = stats.map((stat, index) => {
			if ((stat as Stat<PitReportData, QuantData>).key) {
				// Single stat
				const singleStat = stat as Stat<PitReportData, QuantData>;

				return (
					<h1
						key={index}
						className="max-sm:text-xs"
					>
						{singleStat.label}:{" "}
						{NumericalAverage(singleStat.key as string, props.selectedReports)}
					</h1>
				);
			}

			// Stat pair
			const pair = stat as StatPair<PitReportData, QuantData>;
			if (pair.stats.length !== 2) {
				console.error("Invalid stat pair. Wrong # of stats provided.", pair);
				return <></>;
			}

			const first =
				pair.stats[0].get?.(pitReport ?? undefined, props.selectedReports) ??
				NumericalAverage(pair.stats[0].key as string, props.selectedReports);
			const second =
				pair.stats[1].get?.(pitReport ?? undefined, props.selectedReports) ??
				NumericalAverage(pair.stats[1].key as string, props.selectedReports);

			return (
				<div
					key={index}
					className="w-full h-fit flex flex-row items-center max-sm:text-xs"
				>
					<div>
						<h1>
							{pair.stats[0].label}: {first}
						</h1>
						<h1>
							{pair.stats[1].label}: {second}
						</h1>
					</div>
					<PiGitFork
						className="-rotate-90"
						size={40}
					/>
					<p>
						{pair.label}:{" "}
						{ComparativePercent(
							pair.stats[0].key as string,
							pair.stats[1].key as string,
							props.selectedReports,
						)}
					</p>
				</div>
			);
		});

		const iconDict: { [header: string]: ReactNode } = {
			Positioning: (
				<PiCrosshair
					size={32}
					className="inline"
				/>
			),
			Auto: (
				<FaCode
					size={32}
					className="inline"
				/>
			),
			Teleop: (
				<FaWifi
					size={32}
					className="inline"
				/>
			),
			Comments: (
				<FaComment
					size={32}
					className="inline"
				/>
			),
		};
		const icon = header in iconDict ? iconDict[header] : <></>;

		return (
			<div
				key={header}
				className="mb-2"
			>
				<h1 className="text-xl font-semibold">
					{icon} {header}
				</h1>
				<div className="ml-2">{statElements}</div>
			</div>
		);
	}

	const sections = Object.entries(props.layout.sections).map(
		([header, stats]) => getSections(header, stats),
	);

	return (
		<div className="w-full sm:w-2/5 h-fit flex flex-col bg-base-200 sm:pl-10 py-4 text-sm">
			<h1 className="text-3xl text-accent font-semibold">
				Team #{props.selectedTeam}
			</h1>

			<div className="flex flex-row w-full space-x-2 space-y-1 mt-2 flex-wrap">
				{badges.map((badge, index) => (
					<div
						key={index}
						className={`badge badge-${badge.color}`}
					>
						{badge.text}
					</div>
				))}
			</div>

			<div className="w-1/3 divider"></div>

			{sections}

			<div className="w-1/3 divider"></div>
			<h1 className="text-xl font-semibold">
				<FaComment
					size={32}
					className="inline"
				/>{" "}
				Comments
			</h1>

			<div className="pr-10 w-full h-fit flex flex-row items-center">
				<ul className="w-full">
					{comments ? (
						comments.map((match) =>
							match.matchNum > 0 ? (
								<li
									key={match.matchNum}
									className="w-full"
								>
									<strong>Match {match.matchNum}</strong>
									<ul className="w-full ml-2">
										{match.content
											.sort((a, b) => a.order - b.order)
											.map((content, index) => (
												<Comment
													text={content.text}
													tooltip={content.tooltip}
													key={index}
												/>
											))}
									</ul>
								</li>
							) : (
								match.content
									.sort((a, b) => a.order - b.order)
									.map((content, index) => (
										<Comment
											text={content.text}
											tooltip={content.tooltip}
											key={index}
										/>
									))
							),
						)
					) : (
						<Loading size={24} />
					)}
				</ul>
			</div>
		</div>
	);
}
