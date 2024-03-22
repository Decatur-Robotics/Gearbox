import {
  BooleanAverage,
  MostCommonValue,
  NumericalAverage,
  ComparativePercent,
} from "@/lib/client/StatsMath";
import { Defense, IntakeTypes, Report } from "@/lib/Types";
import { PiCrosshair, PiGitFork } from "react-icons/pi";
import { FaCode, FaCodeFork, FaWifi } from "react-icons/fa6";
import { FaComment } from "react-icons/fa";
import { Round } from '../../lib/client/StatsMath';
import { useEffect, useState } from "react";
import ClientAPI from "@/lib/client/ClientAPI";

const api = new ClientAPI("gearboxiscool");

export default function TeamStats(props: {
  selectedTeam: number | undefined;
  selectedReports: Report[];
}) {
  if (!props.selectedTeam) {
    return (
      <div className="w-2/5 h-1/2 flex flex-col items-center justify-center bg-base-200">
        <h1 className="text-3xl text-accent animate-bounce font-semibold">
          Select A Team
        </h1>
      </div>
    );
  }

  const [comments, setComments] = useState<{match: number, comment: string}[] | null>(null);
  const [teamWeHaveCommentsFor, setTeamWeHaveCommentsFor] = useState<number>(0);

  useEffect(() => {
    if(teamWeHaveCommentsFor === props.selectedTeam) return;
    setTeamWeHaveCommentsFor(props.selectedTeam ?? 0);
    setComments(null);

    const commentList = props.selectedReports.filter((report) => report.data.comments.length > 0);
    if (commentList.length === 0) return setComments([]);

    for (const report of commentList) {
      api.findMatchById(report.match).then((match) => {
        setComments((prev) => ([
          ...prev ?? [],
          {
            match: match.number,
            comment: report.data.comments
          }
        ]));
      });
    }
  });

  const defense = MostCommonValue("Defense", props.selectedReports);
  const intake = MostCommonValue("IntakeType", props.selectedReports);
  const cooperates = BooleanAverage("Coopertition", props.selectedReports);
  const climbs = BooleanAverage("ClimbedStage", props.selectedReports);
  const parks = BooleanAverage("ParkedStage", props.selectedReports);
  const understage = BooleanAverage("UnderStage", props.selectedReports);

  let defenseBadgeColor = "outline";
  if (defense === Defense.Full)
    defenseBadgeColor = "primary";
  else if (defense === Defense.Partial)
    defenseBadgeColor = "accent";

  let intakeBadgeColor = "outline";
  if (intake === IntakeTypes.Both)
    intakeBadgeColor = "primary";
  else if (intake === IntakeTypes.Ground)
    intakeBadgeColor = "accent";
  else if (intake === IntakeTypes.Human)
    intakeBadgeColor = "secondary";

  return (
    <div className="w-2/5 h-fit flex flex-col bg-base-200 pl-10 py-4 text-sm">
      <h1 className="text-3xl text-accent font-semibold">
        Team #{props.selectedTeam}
      </h1>

      <div className="flex flex-row w-full space-x-2 mt-2 flex-wrap">
        <div className={`badge badge-${defenseBadgeColor}`}>
          {defense} Defense
        </div>
        <div className={`badge badge-${intakeBadgeColor}`}>
          {intake} Intake
        </div>
        { cooperates && 
          <div className="badge badge-primary">Cooperates</div>
        }
        { climbs &&
          <div className="badge badge-secondary">Climbs</div>}
        { parks &&
          <div className="badge badge-accent">Parks</div>}
        { understage &&
          <div className="badge badge-neutral">Small Profile</div>}
      </div>

      <div className="w-1/3 divider"></div>

      <h1 className="text-xl font-semibold">
        <PiCrosshair size={32} className="inline" /> Positioning
      </h1>
      <h1>
        Avg Starting Position: (
        {NumericalAverage("AutoStartX", props.selectedReports)},{" "}
        {NumericalAverage("AutoStartY", props.selectedReports)})
      </h1>
      <h1>
        Avg Starting Angle:{" "}
        {Round(NumericalAverage("AutoStartAngle", props.selectedReports) *
          (180 / Math.PI) +
          180)}
        °
      </h1>

      <div className="w-1/3 divider"></div>

      <h1 className="text-xl font-semibold">
        <FaCode size={32} className="inline" /> Auto
      </h1>

      <div className="w-full h-fit flex flex-row items-center">
        <div>
          <h1>
            Avg Scored Amp Shots:{" "}
            {NumericalAverage("AutoScoredAmp", props.selectedReports)}
          </h1>
          <h1>
            Avg Missed Amp Shots:{" "}
            {NumericalAverage("AutoMissedAmp", props.selectedReports)}
          </h1>
        </div>
        <PiGitFork className="-rotate-90" size={40} />
        <p>
          Overall Amp Accuracy:{" "}
          {ComparativePercent(
            "AutoScoredAmp",
            "AutoMissedAmp",
            props.selectedReports,
          )}
        </p>
      </div>

      <div className="w-full h-fit flex flex-row items-center">
        <div>
          <h1>
            Avg Scored Speaker Shots:{" "}
            {NumericalAverage("AutoScoredSpeaker", props.selectedReports)}
          </h1>
          <h1>
            Avg Missed Speaker Shots:{" "}
            {NumericalAverage("AutoMissedSpeaker", props.selectedReports)}
          </h1>
        </div>
        <PiGitFork className="-rotate-90" size={40} />
        <p>
          Overall Speaker Accuracy:{" "}
          {ComparativePercent(
            "AutoScoredSpeaker",
            "AutoMissedSpeaker",
            props.selectedReports,
          )}
        </p>
      </div>

      <div className="w-1/3 divider"></div>
      <h1 className="text-xl font-semibold">
        <FaWifi size={32} className="inline" /> Teleop
      </h1>

      <div className="w-full h-fit flex flex-row items-center">
        <div>
          <h1>
            Avg Scored Amp Shots:{" "}
            {NumericalAverage("TeleopScoredAmp", props.selectedReports)}
          </h1>
          <h1>
            Avg Missed Amp Shots:{" "}
            {NumericalAverage("TeleopMissedAmp", props.selectedReports)}
          </h1>
        </div>
        <PiGitFork className="-rotate-90" size={40} />
        <p>
          Overall Amp Accuracy:{" "}
          {ComparativePercent(
            "TeleopScoredAmp",
            "TeleopMissedAmp",
            props.selectedReports,
          )}
        </p>
      </div>

      <div className="w-full h-fit flex flex-row items-center">
        <div>
          <h1>
            Avg Scored Speaker Shots:{" "}
            {NumericalAverage("TeleopScoredSpeaker", props.selectedReports)}
          </h1>
          <h1>
            Avg Missed Speaker Shots:{" "}
            {NumericalAverage("TeleopMissedSpeaker", props.selectedReports)}
          </h1>
        </div>
        <PiGitFork className="-rotate-90" size={40} />
        <p>
          Overall Speaker Accuracy:{" "}
          {ComparativePercent(
            "TeleopScoredSpeaker",
            "TeleopMissedSpeaker",
            props.selectedReports,
          )}
        </p>
      </div>

      <div className="w-full h-fit flex flex-row items-center">
        <div>
          <h1>
            Avg Scored Trap Shots:{" "}
            {NumericalAverage("TeleopScoredTrap", props.selectedReports)}
          </h1>
          <h1>
            Avg Missed Trap Shots:{" "}
            {NumericalAverage("TeleopMissedTrap", props.selectedReports)}
          </h1>
        </div>
        <PiGitFork className="-rotate-90" size={40} />
        <p>
          Overall Auto Amp Accuracy:{" "}
          {ComparativePercent(
            "TeleopScoredTrap",
            "TeleopMissedTrap",
            props.selectedReports,
          )}
        </p>
      </div>

      <div className="w-1/3 divider"></div>
      <h1 className="text-xl font-semibold">
        <FaComment size={32} className="inline" /> Comments
      </h1>

      <div className="w-full h-fit flex flex-row items-center">
        <ul>
          { comments
            ? <li className="mt-2">
                {comments.length === 0 
                  ? "No comments." 
                  : comments
                      .sort((a, b) => a.match - b.match)
                      .map((report) => <div key={report.match}>Match {report.match}: {report.comment}</div>)
                }
              </li>
            : <div className="flex flex-row">
                <div className="loading loading-spinner mr-2"></div>
                <div>Loading comments...</div>
              </div>
          }
        </ul>
      </div>
    </div>
  );
}
