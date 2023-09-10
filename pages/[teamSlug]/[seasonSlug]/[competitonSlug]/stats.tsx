import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useMemo, useState } from "react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import { GetServerSideProps } from "next";
import { Report } from "@/lib/Types";
import Container from "@/components/Container";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const ChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 3/2,
  layout: {
    padding: 18
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    
    title: {
      display: true,
      text: '',
    },
  },

  scales: {
    y: {
        grid: {
          color: "#404040"
        }
    },
    x: {
        grid: {
          color: "#404040"
        }
    }
  }
};

export type ChartValue = {
  label: string,
  data: number;
}

export interface Dataset {
  label: string,
  data: number[]
  backgroundColor: string;
}

export type ChartData = {
  labels: string[],
  datasets: Dataset[],
}


export const BarColor = "rgba(31, 178, 165, 1)"
export const DefaultChartData = {
  labels: ["No Data"],
  datasets: [{
    label: "No Data",
    data: 0
  }]
}


export function ArraySum(array: number[]): number {
  return array.reduce((a, b) => a+b);
}

const api = new ClientAPI("gearboxiscool");

export default function Home(props: ResolvedUrlData) {

  const team = props.team;
  const season = props.season;
  const comp = props.competition;


  // data states
  const[loadingReports, setLoadingReports] = useState(false)
  const[reports, setReports] = useState<Report[]>([]);
  const[teams, setTeams] = useState<number[]>([]);
  const[labels, setLabels] = useState<string[]>([]);


  // ui states
  const[selectedTeam, setSelectedTeam] = useState<number | undefined>();
  const[selectedLabel, setSelectedLabel] = useState<string>();


  // stat states
  const[loadingStats, setLoadingStats] = useState(false);
  const[avgValues, setAvgValues] = useState<number[]>([])


  // chart states
  const[averageChartData, setAverageChartData] = useState<ChartData>();
 

  // load data
  useEffect(() => {
    async function loadReports() {
        setLoadingReports(true);
        const newReports = await api.competitionReports(comp?._id) as Report[];''
        const newTeams = newReports.map((report) => report.robotNumber);

        // assume all use the same data struct
        if(newReports[0].data?.data) {
          const newLabels = newReports[0].data?.data.map((dataElement) => dataElement.text)

          setLabels(newLabels);
        }
        
        setTeams(newTeams);
        setReports(newReports);
        setLoadingReports(false);
    }

    loadReports();
  }, []);

  // run stats
  useEffect(() => {


    function calculateAverages() {

      if(!selectedLabel) {return;}

      const newAvgValues: number[] = [];
      const labelIndex = labels.indexOf(selectedLabel);
      for(var i = 0; i < teams.length; i++) {
        const values: number[] = []
        reports.forEach((report) => {
          if(report.robotNumber === teams[i]) {
            values.push(report.data?.data[labelIndex].value);
          } 
        });
        newAvgValues.push(ArraySum(values)/values.length);
      }

      setAvgValues(newAvgValues);
      setAverageChartData({labels: teams.map((t) => t.toString()), datasets: [{label: selectedLabel + " (Averaged)", data: newAvgValues, backgroundColor: BarColor}]});

    }

    setLoadingStats(true);
    calculateAverages();

    

    setLoadingStats(false);
    


  }, [selectedLabel])


  return <Container requireAuthentication={true} hideMenu={false}>
    <p>Submitted Reports: {reports.length}</p>
    <p>Observed Teams: {teams.join(", ")}</p>
    <p>Data Labels: {labels.join(", ")}</p>

    <select className="select select-bordered w-full max-w-xs" value={selectedTeam} onChange={(e)=>{setSelectedTeam(Number(e.target.value))}}>
      <option disabled selected>Select Team?</option>
      {
        teams.map((team) => <option value={team}>{team}</option>)
      }
    </select>

    <div className="divider"></div>

    <select className="select select-bordered w-full max-w-xs" value={selectedLabel} onChange={(e)=>{setSelectedLabel(e.target.value)}}>
      <option disabled selected>Select Category?</option>
      {
        labels.map((label) => <option value={label}>{label}</option>)
      }
    </select>

    {/*@ts-ignore --- idk why it gets mad here*/ }
    <Bar options={ChartOptions}  data={averageChartData ? averageChartData: DefaultChartData } className=""></Bar>
  </Container>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  }
}