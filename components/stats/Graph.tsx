import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  layout: {
    padding: 14,
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

export default function BarGraph(props: {
  label: string;
  data: number[];
  xlabels: string[];
}) {
  const data = {
    labels: props.xlabels,
    datasets: [
      {
        label: props.label,
        data: props.data,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return (
    <div className="w-full h-full bg-base-200">
      <Bar options={options} data={data} />
    </div>
  );
}
