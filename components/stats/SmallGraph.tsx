import { Defense } from "@/lib/Enums";
import { Report } from "@/lib/Types";
import ClientApi from "@/lib/api/ClientApi";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
);

const options = {
	responsive: true,

	layout: {
		padding: 18,
	},
	scales: {
		y: {
			grid: {
				color: "#404040",
			},
		},
		x: {
			grid: {
				color: "#404040",
			},
		},
	},
	plugins: {
		colors: {},
		legend: {
			position: "top" as const,
		},
		title: {
			display: false,
			text: "Graph",
		},
	},
};

const api = new ClientApi();

export default function SmallGraph(props: {
	selectedReports: Report[];
	team: number;
}) {
	const [key, setKey] = useState("Defense");
	const keys = Array.from(
		new Set(
			props.selectedReports?.map((r) => Object.keys(r.data)).flat() ?? [],
		),
	);

	const [dataset, setDataset] = useState<
		Set<{
			matchNumber: number;
			data: Record<string, number>;
		}>
	>(new Set());

	const [currentTeam, setCurrentTeam] = useState<number>(0);

	function dataToNumber(key: string, data: any): number {
		if (key === "Defense") {
			let n = 0;
			switch (data) {
				case Defense.None:
					return 0;
				case Defense.Partial:
					return 0.5;
				case Defense.Full:
					return 1;
			}
		}
		return data;
	}

	const datasetArr = Array.from(dataset);

	const data = {
		labels: datasetArr.map((point) => point.matchNumber) ?? [],
		datasets: [
			{
				label: key,
				data: datasetArr.map((report) => dataToNumber(key, report.data[key])),
				backgroundColor: "rgba(255, 99, 132, 0.5)",
			},
		],
	};

	useEffect(() => {
		if (!props.selectedReports) return;

		setCurrentTeam(props.team);

		const newDataset: typeof dataset = new Set();

		Promise.all(
			props.selectedReports.map(async (report) => {
				const match = await api.findMatchById(report.match);
				if (!match) return;

				newDataset.add({
					matchNumber: match.number,
					data: report.data,
				});
			}),
		).then(() =>
			setDataset(
				new Set(
					Array.from(newDataset).sort((a, b) => a.matchNumber - b.matchNumber),
				),
			),
		);
	}, [key, currentTeam, props.selectedReports, props.team]);

	if (!props.selectedReports) {
		return <></>;
	}

	return (
		<div className="w-full h-2/5 bg-base-300 rounded-lg p-4">
			<h1 className="text-2xl font-semibold inline mr-4">Graph</h1>
			<select
				className="select select-sm select-bordered w-1/2 max-w-xs inline-block"
				onChange={(e) => {
					console.log(e.target.value);
					setKey(e.target.value);
				}}
				defaultValue={"selected"}
			>
				<option disabled>Select Variable</option>
				{keys.map((key) => (
					<option
						key={key}
						value={key}
					>
						{key}
					</option>
				))}
			</select>
			<Bar
				options={options}
				data={data}
			/>
		</div>
	);
}
