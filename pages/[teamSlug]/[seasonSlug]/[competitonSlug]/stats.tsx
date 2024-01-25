
import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData, SerializeDatabaseObject } from "@/lib/UrlResolver";

import { GetDatabase, MongoDBInterface, Collections} from "@/lib/MongoDB";
import { Competition, Report } from "@/lib/Types";
import { useEffect, useState } from "react";

import { PiCrosshair, PiGitFork } from "react-icons/pi";
import { FaCode, FaCodeFork, FaWifi } from "react-icons/fa6";

import dynamic from 'next/dynamic';
import p5Types from "p5";
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
});


const SpeakerAutoPoints = 5;
const SpeakerTeleopPoints = 2
const AmpAutoPoints = 2;
const AmpTeleopPoints = 1;
const TrapPoints = 5;

function TotalPoints(reports: Report[]) {
  const speakerAuto = NumericalTotal("AutoScoredSpeaker", reports) * SpeakerAutoPoints;
  const speakerTeleop = NumericalTotal("TeleopScoredAmp", reports) * SpeakerTeleopPoints

  const ampAuto = NumericalTotal("AutoScoredAmp", reports) * AmpAutoPoints;
  const ampTeleop = NumericalTotal("TeleopScoredAmp", reports) * AmpTeleopPoints;

  const trap = NumericalTotal("TeleopScoredTrap", reports) * TrapPoints;
  
  return speakerAuto+speakerTeleop+ampAuto+ampTeleop+trap;
}

function AveragePoints(reports: Report[]) {
  const speakerAuto = NumericalAverage("AutoScoredSpeaker", reports) * SpeakerAutoPoints;
  const speakerTeleop = NumericalAverage("TeleopScoredAmp", reports) * SpeakerTeleopPoints

  const ampAuto = NumericalAverage("AutoScoredAmp", reports) * AmpAutoPoints;
  const ampTeleop = NumericalAverage("TeleopScoredAmp", reports) * AmpTeleopPoints;

  const trap = NumericalAverage("TeleopScoredTrap", reports) * TrapPoints;
  
  return speakerAuto+speakerTeleop+ampAuto+ampTeleop+trap;
}

function DisplayAverage(props: {field: string, reports: Report[]}) {
  const[val, setVal] = useState(0);
  useEffect(() => setVal(NumericalAverage(props.field, props.reports)));
  return <h1 className="text-xl"><span className="font-semibold ">{props.field}:</span> {val}</h1>
}

function NumericalTotal(field: string, reports: Report[]) {
  let sum = 0;
  //@ts-expect-error
  reports?.forEach((report) => sum+=report.data[field]);
  return sum;
}

function StringAverage(field: string, reports: Report[]) {
  let strings: string[] = [];
  //@ts-expect-error
  reports?.forEach((report) => strings.push(report.data[field]));
  const store: {[key: string]: number}= {}
  strings.forEach((num) => store[num] ? store[num] += 1 : store[num] = 1)
  return Object.keys(store).sort((a, b) => store[b] - store[a])[0]
}

function BooleanAverage(field: string, reports: Report[]) {
  const arr: boolean[] = [];
  //@ts-expect-error
  reports?.forEach((report) => arr.push(report.data[field]));
  const count = arr.filter((value) => value).length;
  return count > (arr.length-count);
}

function NumericalAverage(field: string, reports: Report[]) {
  return NumericalTotal(field, reports) / reports?.length
}

function ComparativePercent(field1: string, field2: string, reports: Report[]) {
  const a = NumericalTotal(field1, reports)
  const b = NumericalTotal(field2, reports)
  return a/(b+a);
}

function TeamCard(props: {number: number, rank: number, reports: Report[], onClick: ()=>void, selected: boolean}) {

  return <div className={`card w-full bg-base-300 py-0 ${props.selected ? "border-2 border-primary": ""} hover:border-2 hover:border-primary`} onClick={props.onClick}>
  <div className="card-body">
    <h2 className="card-title text-xl">
      #{props.number}
      <div className="badge badge-primary text-2xl p-3">{props.rank}st</div>
    </h2>
    <p>Avg Points: {AveragePoints(props.reports)}</p>
    <div className="card-actions">
      <div className="badge badge-outline">{StringAverage("Defense", props.reports)} Defense</div> 
      <div className="badge badge-outline">{StringAverage("IntakeType", props.reports)} Intake</div>
      {BooleanAverage("Coopertition", props.reports) ? <div className="badge badge-primary">Cooperates</div>: <></>}
      {BooleanAverage("ClimbedStage", props.reports) ? <div className="badge badge-secondary">Climbs</div>: <></>}
      {BooleanAverage("ParkedStage", props.reports) ? <div className="badge badge-accent">Parks</div>: <></>}
      {BooleanAverage("UnderStage", props.reports) ? <div className="badge badge-neutral">Small Profile</div>: <></>}
    </div>
  </div>
</div>
}

function TeamSelect(props: {selectedTeam: number | undefined, selectedReports: Report[]}) {
  if(!props.selectedTeam)  {
    return <div className="w-2/5 h-3/4 flex flex-col items-center justify-center bg-base-200">
      <h1 className="text-3xl text-accent animate-bounce font-semibold">Select A Team</h1>
    </div>
  }
  

  return <div className="w-2/5 h-fit flex flex-col bg-base-200 pl-10 py-4">
  <h1 className="text-3xl text-accent font-semibold">Team #{props.selectedTeam}</h1>

  <div className="flex flex-row w-full space-x-2 mt-2">
    <div className="badge badge-outline">{StringAverage("Defense", props.selectedReports)} Defense</div> 
    <div className="badge badge-outline">{StringAverage("IntakeType", props.selectedReports)} Intake</div>
    {BooleanAverage("Coopertition", props.selectedReports) ? <div className="badge badge-primary">Cooperates</div>: <></>}
    {BooleanAverage("ClimbedStage", props.selectedReports) ? <div className="badge badge-secondary">Climbs</div>: <></>}
    {BooleanAverage("ParkedStage", props.selectedReports) ? <div className="badge badge-accent">Parks</div>: <></>}
    {BooleanAverage("UnderStage", props.selectedReports) ? <div className="badge badge-neutral">Small Profile</div>: <></>}
  </div>

  <div className="w-1/3 divider"></div>

  <h1 className="text-2xl font-semibold"><PiCrosshair size={45} className="inline"/> Positioning</h1>
  <h1>Avg Starting Position: ({NumericalAverage("AutoStartX", props.selectedReports)}, {NumericalAverage("AutoStartY", props.selectedReports)})</h1>
  <h1>Avg Starting Angle: {(NumericalAverage("AutoStartAngle", props.selectedReports) * (180/Math.PI))+180}°</h1>

  <div className="w-1/3 divider"></div>

  <h1 className="text-2xl font-semibold"><FaCode size={40} className="inline"/> Auto</h1>

  <div className="w-full h-fit flex flex-row items-center">
    <div>
      <h1>Avg Scored Amp Shots: {NumericalAverage("AutoScoredAmp", props.selectedReports)}</h1>
      <h1>Avg Missed Amp Shots: {NumericalAverage("AutoMissedAmp", props.selectedReports)}</h1>
    </div>
    <PiGitFork className="-rotate-90" size={40}/>
    <p>Overall Amp Accuracy: {ComparativePercent("AutoScoredAmp", "AutoMissedAmp", props.selectedReports)}</p>
  </div>

  <div className="w-full h-fit flex flex-row items-center">
    <div>
      <h1>Avg Scored Speaker Shots: {NumericalAverage("AutoScoredSpeaker", props.selectedReports)}</h1>
      <h1>Avg Missed Speaker Shots: {NumericalAverage("AutoMissedSpeaker", props.selectedReports)}</h1>
    </div>
    <PiGitFork className="-rotate-90" size={40}/>
    <p>Overall Speaker Accuracy: {ComparativePercent("AutoScoredSpeaker", "AutoMissedSpeaker", props.selectedReports)}</p>
  </div>

  <div className="w-1/3 divider"></div>
  <h1 className="text-2xl font-semibold"><FaWifi size={40} className="inline"/> Teleop</h1>
 
  <div className="w-full h-fit flex flex-row items-center">
    <div>
      <h1>Avg Scored Amp Shots: {NumericalAverage("TeleopScoredAmp", props.selectedReports)}</h1>
      <h1>Avg Missed Amp Shots: {NumericalAverage("TeleopMissedAmp", props.selectedReports)}</h1>
    </div>
    <PiGitFork className="-rotate-90" size={40}/>
    <p>Overall Amp Accuracy: {ComparativePercent("TeleopScoredAmp", "TeleopMissedAmp", props.selectedReports)}</p>
  </div>

  <div className="w-full h-fit flex flex-row items-center">
    <div>
      <h1>Avg Scored Speaker Shots: {NumericalAverage("TeleopScoredSpeaker", props.selectedReports)}</h1>
      <h1>Avg Missed Speaker Shots: {NumericalAverage("TeleopMissedSpeaker", props.selectedReports)}</h1>
    </div>
    <PiGitFork className="-rotate-90" size={40}/>
    <p>Overall Speaker Accuracy: {ComparativePercent("TeleopScoredSpeaker", "TeleopMissedSpeaker", props.selectedReports)}</p>
  </div>

  <div className="w-full h-fit flex flex-row items-center">
    <div>
      <h1>Avg Scored Trap Shots: {NumericalAverage("TeleopScoredTrap", props.selectedReports)}</h1>
      <h1>Avg Missed Trap Shots: {NumericalAverage("TeleopMissedTrap", props.selectedReports)}</h1>
    </div>
    <PiGitFork className="-rotate-90" size={40}/>
    <p>Overall Auto Amp Accuracy: {ComparativePercent("TeleopScoredTrap", "TeleopMissedTrap", props.selectedReports)}</p>
  </div>

</div>

}

interface Position {
  x: number;
  y: number;
}

var bg: p5Types.Image;
const resolution = 25;
var positions: Position[] = [];

function Heatmap(props: {selectedReports: Report[]}) {
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    bg = p5.loadImage("/croppedFieldBlue.PNG");
    p5.createCanvas(350, 300).parent(canvasParentRef);
    p5.rectMode(p5.CENTER);
    p5.stroke(1);
  }

  const inSquare = (x: number,y: number,w:number) => {
    let counter = 0;
    positions.forEach((pos) => {
      if(Math.abs(pos.x - x) <= w) {
        if(Math.abs(pos.y - y) <= w) {
          counter++;
        }
      }
    });
    return counter;
  }

  useEffect(() => {
    if(props.selectedReports) {
      positions = [];
      props.selectedReports.forEach((report) => (positions.push({x: report.data.AutoStartX, y: report.data.AutoStartY})));
    }
  })

  const draw = (p5: p5Types) => {
    p5.background(bg);

    for(var x = 0; x < p5.width+resolution; x += resolution) {
      for(var y = 0; y < p5.height+resolution; y += resolution) {
        var v = inSquare(x,y,resolution) / (positions.length/2);
        p5.fill(p5.lerpColor(p5.color(124,252,0, 150), p5.color(255, 0, 0, 200), v));
        p5.rect(x, y, resolution, resolution)
      }
    }
  }

  return <Sketch setup={setup} draw={draw} />

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
          
          <TeamSelect selectedReports={selectedReports} selectedTeam={selectedTeam}></TeamSelect>

          <div className="w-5/12 h-[300px] flex flex-row justify-end mt-2">
            <div className="w-3/4 h-full bg-base-300 rounded-l-lg">
            <code className="w-full h-full mx-auto text-sm font-semibold ">
              {`Analysis suggests that this robot favors starting ${"Left"} on the field, at ${"High"} angles of attack `}
              {`Outfitted with a ${"Ground"} Intake, this robot is a ${"High"} Auto Performer`}
            </code>
            </div>

            <div className="w-[350px] h-[300px] float-right">
              <Heatmap selectedReports={selectedReports}></Heatmap>
            </div>
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
