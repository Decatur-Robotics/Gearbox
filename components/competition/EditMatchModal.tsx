import ClientApi from "@/lib/api/ClientApi";
import { Competition, Match, Report, User } from "@/lib/Types";
import { ChangeEvent } from "react";

const api = new ClientApi();

export default function EditMatchModal(props: {
	close: () => void;
	match?: Match;
	reportsById: { [id: string]: Report };
	usersById: { [id: string]: User };
	comp: Competition | undefined;
	loadReports: () => void;
	loadMatches: () => void;
}) {
	if (props.match === undefined) return <></>;

	const { match, reportsById, usersById, comp, loadReports, loadMatches } =
		props;

	const teams = props.match.blueAlliance.concat(props.match.redAlliance);

	const reports = props.match.reports.map((reportId) => reportsById[reportId]);
	if (!reports) return <></>;

	function changeScouter(e: ChangeEvent<HTMLSelectElement>, report: Report) {
		e.preventDefault();

		const userId = e.target.value;
		if (!userId || !report || !report._id) return;

		console.log(`Changing scouter for report ${report._id} to ${userId}`);
		api.changeScouterForReport(report._id, userId).then(loadReports);
	}

	function changeSubjectiveScouter(e: ChangeEvent<HTMLSelectElement>) {
		e.preventDefault();

		const userId = e.target.value;
		if (!userId || !props.match?._id) return;

		console.log(
			`Changing subjective scouter for match ${props.match?._id} to ${userId}`,
		);
		api
			.setSubjectiveScouterForMatch(props.match?._id, userId)
			.then(loadMatches);
	}

	function changeTeamNumber(e: ChangeEvent<HTMLInputElement>, index: number) {
		e.preventDefault();

		const teamNumber = +e.target.value;
		if (!teamNumber || !props.match?._id) return;

		const reportId = props.match?.reports[index];
		if (!props.reportsById[reportId]._id) return;

		console.log(
			`Changing team ${index} for match ${props.match?._id} to ${teamNumber}`,
		);

		api
			.changeTeamNumberForReport(
				match._id!.toString(),
				props.reportsById[reportId]._id,
				teamNumber,
			)
			.then(() => {
				loadMatches();
				loadReports();
			});
	}

	return (
		<dialog
			id="edit-match-modal"
			className="modal"
			open={match !== undefined}
		>
			<div className="modal-box">
				<button
					onClick={props.close}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				>
					X
				</button>
				<h3 className="text-xl">Editing Match {props.match?.number}</h3>
				<table className="w-full">
					<thead>
						<tr>
							<th className="px-4">Position</th>
							<th className="px-4">Team</th>
							<th className="px-4">Scouter</th>
							<th className="px-4">Subjective Scouter</th>
						</tr>
					</thead>
					<tbody>
						{teams.map((team, index) => (
							<tr key={index}>
								<td
									className={`px-4 ${index < 3 ? "text-blue-500" : "text-red-500"}`}
								>
									{index < 3 ? "Blue" : "Red"} {(index % 3) + 1}
								</td>
								<td className="px-4">
									<input
										onChange={(e) => changeTeamNumber(e, index)}
										type="number"
										defaultValue={team}
									/>
								</td>
								<td className="px-4">
									<select onChange={(e) => changeScouter(e, reports[index])}>
										{reports[index]?.user &&
										usersById[reports[index].user ?? ""] ? (
											<option value={reports[index].user}>
												{usersById[reports[index].user ?? ""]?.name}
											</option>
										) : (
											<></>
										)}
										<option value={undefined}>None</option>
										{Object.keys(usersById)
											.filter((id) => id !== reports[index]?.user)
											.map((userId) => (
												<option
													key={userId}
													value={userId}
												>
													{usersById[userId]?.name ?? "Unknown"}
												</option>
											))}
									</select>
								</td>
								<td className="px-4">
									{index === 0 && (
										<select onChange={changeSubjectiveScouter}>
											{props.match?.subjectiveScouter &&
											usersById[props.match.subjectiveScouter] ? (
												<option value={props.match.subjectiveScouter}>
													{usersById[props.match.subjectiveScouter].name}
												</option>
											) : (
												<></>
											)}
											<option value={undefined}>None</option>
											{Object.keys(usersById)
												.filter((id) => id !== props.match?.subjectiveScouter)
												.map((userId) => (
													<option
														key={userId}
														value={userId}
													>
														{usersById[userId]?.name ?? "Unknown"}
													</option>
												))}
										</select>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</dialog>
	);
}
