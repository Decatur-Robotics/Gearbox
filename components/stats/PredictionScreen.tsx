import { Game, Report } from "@/lib/Types";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

function AllianceBuilder(props: {
	teams: number[];
	alliance: (number | undefined)[];
	update: (index: number, team: number) => void;
	name: string;
	color: string;
}) {
	return (
		<div className="flex flex-col w-1/2">
			<h1 className={`text-${props.color} text-center`}>
				{props.name} Alliance
			</h1>
			<div className="flex flex-row items-stretch">
				{props.alliance.map((team, index) => (
					<select
						key={index}
						className="w-full select"
						value={team}
						onChange={(e) => props.update(index, parseInt(e.target.value))}
					>
						<option value={undefined}>Empty</option>
						{props.teams.map((t) => (
							<option
								key={t}
								value={t}
							>
								{t}
							</option>
						))}
					</select>
				))}
			</div>
		</div>
	);
}

export default function PredictionScreen(props: {
	reports: Report[];
	teams: number[];
	game: Game;
}) {
	const [reportsByTeam, setReportsByTeam] = useState<Record<number, Report[]>>(
		{},
	);

	// Array(length) constructor doesn't actually fill the array with undefined, so we have to do it manually
	const [blueAlliance, setBlueAlliance] = useState<(number | undefined)[]>(
		Array(props.game.allianceSize).fill(undefined),
	);
	const [redAlliance, setRedAlliance] = useState<(number | undefined)[]>(
		Array(props.game.allianceSize).fill(undefined),
	);

	useEffect(() => {
		const reportsByTeam = props.reports.reduce(
			(acc, report) => {
				if (!acc[report.robotNumber]) {
					acc[report.robotNumber] = [];
				}

				acc[report.robotNumber].push(report);
				return acc;
			},
			{} as Record<number, Report[]>,
		);

		setReportsByTeam(reportsByTeam);
	}, [props.reports]);

	function updateAlliance(
		setAlliance: (alliance: (number | undefined)[]) => void,
		alliance: (number | undefined)[],
		index: number,
		team: number,
	) {
		alliance[index] = team;
		setAlliance([...alliance]); // We have to create a new array for the update to work
	}

	const blueAllianceFilled = blueAlliance.filter((team) => team !== undefined);
	const redAllianceFilled = redAlliance.filter((team) => team !== undefined);

	const avgPointsBlueAllianceIndividual = blueAllianceFilled.map((team) =>
		props.game.getAvgPoints(reportsByTeam[team!]),
	);
	const avgPointsRedAllianceIndividual = redAllianceFilled.map((team) =>
		props.game.getAvgPoints(reportsByTeam[team!]),
	);

	const totalPointsBlueAlliance = avgPointsBlueAllianceIndividual.reduce(
		(acc, points) => acc + points,
		0,
	);
	const totalPointsRedAlliance = avgPointsRedAllianceIndividual.reduce(
		(acc, points) => acc + points,
		0,
	);

	const datasets = [];
	for (
		let i = 0;
		i <
		Math.max(
			avgPointsBlueAllianceIndividual.length,
			avgPointsRedAllianceIndividual.length,
		);
		i++
	) {
		const blue = avgPointsBlueAllianceIndividual[i] || undefined;
		const red = avgPointsRedAllianceIndividual[i] || undefined;

		datasets.push({
			data: [blue, red],
			label: `Team ${blueAllianceFilled[i] || "Empty"} vs Team ${redAllianceFilled[i] || "Empty"}`,
			backgroundColor: [
				`rgba(0, ${(i * 255) / 2}, 235, 1)`,
				`rgba(235, ${(i * 255) / 2}, 0, 1)`,
			],
		});
	}

	const pointDiff = totalPointsBlueAlliance - totalPointsRedAlliance;
	let winner = "Tie";
	let color = "";
	if (pointDiff > 0) {
		winner = "Blue Alliance";
		color = "blue-500";
	} else if (pointDiff < 0) {
		winner = "Red Alliance";
		color = "red-500";
	}

	return (
		<div className="w-full h-fit flex flex-col space-y-2">
			<div className="flex flex-row w-full">
				<AllianceBuilder
					teams={props.teams}
					alliance={blueAlliance}
					update={(index, team) =>
						updateAlliance(setBlueAlliance, blueAlliance, index, team)
					}
					name="Blue"
					color="blue-500"
				/>
				<AllianceBuilder
					teams={props.teams}
					alliance={redAlliance}
					update={(index, team) =>
						updateAlliance(setRedAlliance, redAlliance, index, team)
					}
					name="Red"
					color="red-500"
				/>
			</div>
			<h1 className={`text-xl text-center text-${color}`}>
				{pointDiff != 0
					? `${winner} wins by ${Math.abs(pointDiff)} points`
					: winner}{" "}
				({totalPointsBlueAlliance} - {totalPointsRedAlliance})
			</h1>
			{/* If we don't have bar graph in a div, it will vertically expand into infinity. Don't question it. - Renato */}
			<div>
				<Bar
					data={{
						datasets,
						labels: ["Blue Alliance", "Red Alliance"],
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							x: {
								stacked: true,
							},
							y: {
								stacked: true,
							},
						},
					}}
					height={"450px"}
				/>
			</div>
		</div>
	);
}
