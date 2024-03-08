import { BooleanAverage, StringAverage, NumericalAverage, ComparativePercent} from "@/lib/client/StatsMath"
import { Report } from "@/lib/Types"
import { PiCrosshair, PiGitFork } from "react-icons/pi";
import { FaCode, FaCodeFork, FaWifi } from "react-icons/fa6";
import { FaComment } from "react-icons/fa";

export default function TeamStats(props: {selectedTeam: number | undefined, selectedReports: Report[]}) {
    if(!props.selectedTeam)  {
      return <div className="w-2/5 h-1/2 flex flex-col items-center justify-center bg-base-200">
        <h1 className="text-3xl text-accent animate-bounce font-semibold">Select A Team</h1>
      </div>
    }
    
  
    return <div className="w-2/5 h-fit flex flex-col bg-base-200 pl-10 py-4 text-sm">
    <h1 className="text-3xl text-accent font-semibold">Team #{props.selectedTeam}</h1>
  
    <div className="flex flex-row w-full space-x-2 mt-2 flex-wrap space-y-1">
      <div className="badge badge-outline">{StringAverage("Defense", props.selectedReports)} Defense</div> 
      <div className="badge badge-outline">{StringAverage("IntakeType", props.selectedReports)} Intake</div>
      {BooleanAverage("Coopertition", props.selectedReports) ? <div className="badge badge-primary">Cooperates</div>: <></>}
      {BooleanAverage("ClimbedStage", props.selectedReports) ? <div className="badge badge-secondary">Climbs</div>: <></>}
      {BooleanAverage("ParkedStage", props.selectedReports) ? <div className="badge badge-accent">Parks</div>: <></>}
      {BooleanAverage("UnderStage", props.selectedReports) ? <div className="badge badge-neutral">Small Profile</div>: <></>}
    </div>
  
    <div className="w-1/3 divider"></div>
  
    <h1 className="text-xl font-semibold"><PiCrosshair size={32} className="inline"/> Positioning</h1>
    <h1>Avg Starting Position: ({NumericalAverage("AutoStartX", props.selectedReports)}, {NumericalAverage("AutoStartY", props.selectedReports)})</h1>
    <h1>Avg Starting Angle: {(NumericalAverage("AutoStartAngle", props.selectedReports) * (180/Math.PI))+180}°</h1>
  
    <div className="w-1/3 divider"></div>
  
    <h1 className="text-xl font-semibold"><FaCode size={32} className="inline"/> Auto</h1>
  
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
    <h1 className="text-xl font-semibold"><FaWifi size={32} className="inline"/> Teleop</h1>
   
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

    <div className="w-1/3 divider"></div>
    <h1 className="text-xl font-semibold"><FaComment size={32} className="inline"/> Comments</h1>

    <div className="w-full h-fit flex flex-row items-center">
      <ul>
        {props.selectedReports.map((report) => <li className="mt-2">"{report.data.Comment?.length > 1 ? report.data.Comment: "[No Comment]"}"</li>)}
      </ul>
    </div>


  
  </div>
  
  }