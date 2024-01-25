
import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData, SerializeDatabaseObject } from "@/lib/UrlResolver";

import { GetDatabase, Collections} from "@/lib/MongoDB";
import { Competition, Report } from "@/lib/Types";
import { useEffect, useState } from "react";

import { AveragePoints, StringAverage, BooleanAverage } from "@/lib/client/StatsMath";

import Heatmap from "@/components/stats/Heatmap";
import TeamStats from "@/components/stats/TeamStats";
import Summary from "@/components/stats/Summary";
import SmallGraph from "@/components/stats/SmallGraph";

function TeamCard(props: {number: number, rank: number, reports: Report[], onClick: ()=>void, selected: boolean}) {

  return <div className={`card w-full bg-base-300 py-0 ${props.selected ? "border-2 border-primary": ""} hover:border-2 hover:border-primary`} onClick={props.onClick}>
  <div className="card-body">
    <h2 className="card-title text-xl">
      #{props.number}
      <div className="badge badge-primary text-2xl p-3">{props.rank}st</div>
    </h2>
    <p>Avg Points: {AveragePoints(props.reports)}</p>
    <div className="card-actions">
      <div className="badge badge-sm badge-outline">{StringAverage("Defense", props.reports)} Defense</div> 
      <div className="badge badge-sm badge-outline">{StringAverage("IntakeType", props.reports)} Intake</div>
      {BooleanAverage("Coopertition", props.reports) ? <div className="badge badge-sm badge-primary">Cooperates</div>: <></>}
      {BooleanAverage("ClimbedStage", props.reports) ? <div className="badge badge-sm badge-secondary">Climbs</div>: <></>}
      {BooleanAverage("ParkedStage", props.reports) ? <div className="badge badge-sm badge-accent">Parks</div>: <></>}
      {BooleanAverage("UnderStage", props.reports) ? <div className="badge badge-sm badge-neutral">Small Profile</div>: <></>}
    </div>
  </div>
</div>
}

export default function Stats(props: {reports: Report[], competition: Competition}) {

   
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  const reports = props.reports;

  const [associatingTeams, setAssociatingTeams] = useState(true);
  const[teamReports, setTeamReports] = useState<{[key: number]: Report[]}>({});
  const teamNumbers = Object.keys(teamReports);

  const[teamRanking, setTeamRanking] = useState<string[]>([]);

  const[selectedTeam, setSelectedTeam] = useState<number>();
  const selectedReports = teamReports[selectedTeam ? selectedTeam : 0];

  const associateTeams = () => {
    setAssociatingTeams(true);

    reports.forEach((report) => {
      if(!(report.robotNumber in teamReports)) {
        teamReports[report.robotNumber] = [report];
      } else {
        teamReports[report.robotNumber].push(report);
      }
    });

    setAssociatingTeams(false);
  }

  const rankTeams = () => {
    const ranked = Object.keys(teamReports).sort((a, b) => {
      const a1 = AveragePoints(teamReports[Number(a)]);
      const b1 = AveragePoints(teamReports[Number(b)])
      if (a1 < b1) {
        return 1;
      } else if (a1 > b1) {
        return -1;
      }
      return 0;
    });
    setTeamRanking(ranked);
  }
  

  useEffect(() => {
    if(teamNumbers.length < 1) {
      associateTeams();
      rankTeams();
    }
  });


  return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full h-full flex flex-row space-x-4 ">
          <div className="w-1/5 h-full flex flex-col space-y-4 overflow-y-auto">
          {
            teamRanking.map((number, index) => <TeamCard number={Number(number)} selected={selectedTeam === Number(number)} reports={teamReports[Number(number)]} rank={index+1} onClick={()=>{setSelectedTeam(Number(number))}}></TeamCard>)
          }
          </div>
          
          <TeamStats selectedReports={selectedReports} selectedTeam={selectedTeam}></TeamStats>
          
          <div className="w-5/12 h-full flex flex-col space-y-4">
            <div className="w-full h-[300px] flex flex-row justify-end mt-2">
              <div className="w-3/4 p-2 h-full bg-base-300 rounded-l-lg">
                <Summary selectedReports={selectedReports}></Summary>
              </div>

              <div className="w-[350px] h-[300px] float-right">
                <Heatmap selectedReports={selectedReports}></Heatmap>
              </div>
            </div>

            <SmallGraph selectedReports={selectedReports}></SmallGraph>

          </div>
          

        </div> 
    </Container>

}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();
  const url = await UrlResolver(context);
  const dbReports = await db.findObjects<Report>(Collections.Reports, {"match": {"$in": url.competition?.matches}, "submitted": true});
  const reports = dbReports.map((report) => SerializeDatabaseObject(report))
  return {
    props: {reports:  reports, competition: url.competition}
  }
}
