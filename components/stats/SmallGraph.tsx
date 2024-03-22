import { Report, FormData } from "@/lib/Types";
import ClientAPI from "@/lib/client/ClientAPI";

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

const api = new ClientAPI("gearboxiscool");

export default function SmallGraph(props: { selectedReports: Report[], team: number }) {
  const [key, setKey] = useState("AutoStartX");
  const keys = Object.keys(new FormData());

  const [labels, setLabels] = useState<string[] | null>(null);
  const [currentTeam, setCurrentTeam] = useState<number>(0);
  
  const data = {
    labels,
    datasets: [
      {
        label: key,
        data: props.selectedReports?.map((report) => report.data[key]),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  useEffect(() => {
    if (!props.selectedReports || (labels && currentTeam === props.team)) return;

    setLabels([]);
    setCurrentTeam(props.team);
    for (const report of props.selectedReports) {
      api.findMatchById(report.match).then((match) => {
        setLabels((prev) => [...prev ?? [], match.number.toString()]);
      });
    }
  });

  if (!props.selectedReports) {
    return <></>;
  }

  return (
    <div className="w-full h-2/5 bg-base-300 rounded-lg p-4">
      <h1 className="text-2xl font-semibold inline mr-4">Graph</h1>
      <select
        className="select select-sm select-bordered w-1/2 max-w-xs inline-block"
        onChange={(e) => {
          setKey(e.target.value);
        }}
      >
        <option disabled selected>
          Select Variable
        </option>
        {keys.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      <Bar options={options} data={{
        ...data, labels: data.labels ?? ["Loading..."]
      }} />
    </div>
  );
}
