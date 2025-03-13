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

	const reports = props.match.reports.map((reportId) => reportsById[reportId.toString()]);
	if (!reports) return <></>;

	function changeScouter(e: ChangeEvent<HTMLSelectElement>, report: Report) {
		e.preventDefault();

		const userId = e.target.value;
		if (!userId || !report || !report._id) return;

		console.log(`Changing scouter for report ${report._id} to ${userId}`);
		api.changeScouterForReport(report._id.toString(), userId).then(loadReports);
	}

	function changeSubjectiveScouter(e: ChangeEvent<HTMLSelectElement>) {
		e.preventDefault();

		const userId = e.target.value;
		if (!userId || !props.match?._id) return;

		console.log(
			`Changing subjective scouter for match ${props.match?._id} to ${userId}`,
		);
		api
			.setSubjectiveScouterForMatch(props.match?._id.toString(), userId)
			.then(loadMatches);
	}

	function changeTeamNumber(e: ChangeEvent<HTMLInputElement>, index: number) {
		e.preventDefault();

		const teamNumber = +e.target.value;
		if (!teamNumber || !props.match?._id) return;

		const reportId = props.match?.reports[index];
		if (!props.reportsById[reportId.toString()]._id) return;

		console.log(
			`Changing team ${index} for match ${props.match?._id} to ${teamNumber}`,
		);

		api
			.changeTeamNumberForReport(
				match._id!.toString(),
				props.reportsById[reportId.toString()]._id.toString(),
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
				<table className="space-x-2">
					<thead>
						<tr>
							<th>Position</th>
							<th>Team</th>
							<th>Scouter</th>
						</tr>
					</thead>
					<tbody>
						{teams.map((team, index) => (
							<tr key={index}>
								<td className={index < 3 ? "text-blue-500" : "text-red-500"}>
									{index < 3 ? "Blue" : "Red"} {(index % 3) + 1}
								</td>
								<td>
									<input
										onChange={(e) => changeTeamNumber(e, index)}
										type="number"
										defaultValue={team}
									/>
								</td>
								<td>
									<select onChange={(e) => changeScouter(e, reports[index])}>
										{reports[index]?.user &&
										usersById[reports[index].user.toString()] ? (
											<option value={reports[index].user.toString()}>
												{usersById[reports[index].user.toString()]?.name}
											</option>
										) : (
											<></>
										)}
										<option value={undefined}>None</option>
										{Object.keys(usersById)
											.filter((id) => id !== reports[index]?.user?.toString())
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
							</tr>
						))}
					</tbody>
				</table>
				<div className="flex flex-row space-x-2">
					<label>Subjective Scouter:</label>
					<select onChange={changeSubjectiveScouter}>
						{props.match?.subjectiveScouter &&
						usersById[props.match.subjectiveScouter.toString()] ? (
							<option value={props.match.subjectiveScouter.toString()}>
								{usersById[props.match.subjectiveScouter.toString()].name}
							</option>
						) : (
							<></>
						)}
						<option value={undefined}>None</option>
						{Object.keys(usersById)
							.filter((id) => id !== props.match?.subjectiveScouter?.toString())
							.map((userId) => (
								<option
									key={userId}
									value={userId}
								>
									{usersById[userId]?.name ?? "Unknown"}
								</option>
							))}
					</select>
				</div>
			</div>
		</dialog>
	);
}
