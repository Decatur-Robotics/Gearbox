import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useCallback, useEffect, useMemo, useState } from "react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import { GetServerSideProps } from "next";
import { FormElementType, Report } from "@/lib/Types";
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
import { TimeString } from "@/lib/client/FormatTime";
import { AiOutlineSync } from "react-icons/ai";

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
  const[lastUpdate, setLastUpdate] = useState(0);
  const[reports, setReports] = useState<Report[]>([]);
  
  const[selectedTeam, setSelectedTeam] = useState<string>();
  const[selectedField, setSelectedField] = useState<string>();
  const[selectedChartData, setSelectedChartData] = useState<ChartData>();
  const[selectedAvergae, setSelectedAverage] = useState<number>(0);
  const[selectedComments, setSelectedComments] = useState<string[]>([]);


  // overall stats
  const[completion, setCompletion] = useState(0);
  const[formFields, setFormFields] = useState<string[]>([]);
  const[participatingTeams, setParticipatingTeams] = useState<string[]>([]);
  const[teamOverallScores, setTeamOverallScores] = useState<{[team: string]: number}>({});
  const[teamRanking, setTeamRanking] = useState<string[]>([]);


  async function topLevelStats() {
    if(!comp) {return;}
    const totalMatches = comp?.matches.length*6;
    setCompletion(reports.length/totalMatches);

    let teams: string[] = [];
    let teamPerformanceObject: {[team: string]: number} = {};
    reports.forEach((report) => {
      const number = String(report.robotNumber)
      if(!teams.includes(number)) {
        teams.push(number);
        teamPerformanceObject[report.robotNumber] = 0;
      };

      // get culmative points
      report.data?.data.forEach((datapoint) => {
        if(datapoint.type === FormElementType.Number) {
          teamPerformanceObject[number] += datapoint.value;
        }
      })
    });
    
    var result = teams.sort((a, b) => {
      if(teamPerformanceObject[a] > teamPerformanceObject[b]) {
        return -1;
      }

      if(teamPerformanceObject[a] < teamPerformanceObject[b]) {
        return 1;
      }

      return 0;
    });


    if(reports[0]) {
      if(reports[0].data?.data) {
        setFormFields(reports[0].data?.data.map((datapoint) => datapoint.ref));
      }
    }
  
    setTeamRanking(result);
    setTeamOverallScores(teamPerformanceObject);
    setParticipatingTeams(teams)
  }

  const selectedStats = useCallback(() => {

    let completedReports: number[] = [];
    let values: number[] = [];
    let comments: string[] = []
    reports.forEach((report, index) => {

      if(report.robotNumber.toString() === selectedTeam) {
        completedReports.push(index);
        report.data?.data.forEach(datapoint => {
          if(datapoint.ref === selectedField) {
            values.push(datapoint.value);
          }
          if(datapoint.type === FormElementType.Text) {
            comments.push(datapoint.value);
          }
        });
      }
    });

    if(values.length > 0) {
      setSelectedAverage(ArraySum(values)/values.length);
    }
    
    
    setSelectedComments(comments);
    setSelectedChartData({labels: completedReports.map((t) => t.toString()), datasets: [{label: selectedField + " ()", data: values, backgroundColor: BarColor}]});
  }, [reports, selectedField, selectedTeam]);
  
  async function loadReports() {
    setLoadingReports(true);
    setReports(await api.competitionReports(comp?._id, true));
    setLastUpdate(Date.now());
    setLoadingReports(false);
  }

  useEffect(() => {
    loadReports();
  }, [])

  useEffect(() => {
    topLevelStats();
  }, [reports])

  useEffect(() => {
    selectedStats();
  }, [selectedTeam, selectedField])


  return <Container requireAuthentication={true} hideMenu={false}>

  <div className="w-full flex flex-col items-center justify-between space-y-10">

     <div className="card w-5/6 bg-base-200 shadow-xl mt-10">
        <div className="card-body">
            <h2 className="card-title text-2xl">Competition Stats</h2>
            <p className="text-sm italic">Updated: {TimeString(lastUpdate)}</p>
            <h3 className="text-sm italic">Live Sync Enabled <div className={`w-3 h-3 rounded-full bg-success animate-pulse inline-block ml-1`}></div> </h3>
            <button onClick={loadReports} className="btn btn-sm w-1/2 lg:w-1/6 btn-outline normal-case">Force Update <AiOutlineSync/> </button>
            <div className="divider"></div>
            <p>Report Progress (Completion)</p>
            <div className="flex flex-row items-center space-x-5">
              <progress className="progress progress-accent w-56" value={completion} max="1"></progress>
              <p className="font-bold">{completion.toFixed(2)}%</p>
            </div>

        </div>
     </div>

     <div className="card w-5/6 bg-base-200 shadow-xl">
        {!loadingReports ? <div className="card-body">
            <h2 className="card-title text-2xl"></h2>
           
            <div className="divider"></div>
            <div className="w-full flex flex-row">

              <div className="card w-1/3 bg-base-300">
                <div className="card-body">
                <h2 className="card-title text-lg">Top Scorers (Totaled Points)</h2>

                <div className="w-full flex flex-col items-center space-y-1">
                  {teamRanking.map((team, index) => <div  key={team} className="card w-full bg-base-200 p-4 flex flex-row"><p className="font-bold w-1/6">{index+1}</p><div className="divider divider-horizontal"></div><p className="w-5/6 font-bold">{team} - {teamOverallScores[team]} points</p></div>)}

                </div>
                </div>
              </div>

              <div className="divider divider-horizontal"></div>
              <div className="card w-2/3 bg-base-200">
                <div className="card-body">
                <h2 className="text-xl font-semibold">Specific Team Insight (Historical)</h2>
                <p>Select a specific team</p>
                <select className="select select-bordered w-full max-w-xs" value={selectedTeam} onChange={(e) => {setSelectedTeam(e.target.value)}}>
                  {
                    teamRanking.map((team) => <option key={team}>{team}</option>)
                  }
                </select>

                {selectedTeam ? <div>
                  <p>Select a specific datapoint</p>
                  <select className="select select-bordered w-full max-w-xs" value={selectedField} onChange={(e) => {setSelectedField(e.target.value)}}>
                {
                  formFields.map((field) => <option key={field}>{field}</option>)
                }
                </select></div>: <></>}

                <p>Calculated Average: {selectedAvergae.toFixed(2)} points</p>

                {/*@ts-ignore --- idk why it gets mad here*/ }
                <Bar options={ChartOptions}  data={selectedChartData ? selectedChartData: DefaultChartData } className=""></Bar>

                <p>Comments: </p>
                {selectedComments.length > 0 ? selectedComments.map((comment) => <p key={comment}>{comment}</p>) : <p>No Comments</p>}

                </div>
              </div>

            </div>


        </div> : <div className="w-full flex flex-col items-center justify-center">Loading...<span className="loading loading-spinner loading-lg"></span></div> }
     </div>
  </div>



  
  


    

    

    

    
  </Container>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  }
}