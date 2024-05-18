import {
  BooleanAverage,
  MostCommonValue,
  NumericalAverage,
  ComparativePercent,
} from "@/lib/client/StatsMath";
import { Defense, Drivetrain, IntakeTypes, Pitreport, Report, SubjectiveReport, SubjectiveReportSubmissionType, SwerveLevel } from "@/lib/Types";
import { PiCrosshair, PiGitFork } from "react-icons/pi";
import { FaCode, FaCodeFork, FaWifi } from "react-icons/fa6";
import { FaComment } from "react-icons/fa";
import { Round } from '../../lib/client/StatsMath';
import { ReactNode, useEffect, useState } from "react";
import ClientAPI from "@/lib/client/ClientAPI";
import Loading from "../Loading";

const api = new ClientAPI("gearboxiscool");

export default function TeamStats(props: {
  selectedTeam: number | undefined;
  selectedReports: Report[];
  pitReport: Pitreport | null;
  subjectiveReports: SubjectiveReport[];
}) {
  const [comments, setComments] = useState<{match: number, content: ReactNode}[] | null>(null);

  useEffect(() => {
    if(!props.selectedTeam) return;
    setComments(null);

    const newComments: typeof comments = [];

    newComments.push({ 
      match: 0, 
      content: pitReport 
        ? pitReport.comments.length > 0 
          ? `Pit Report: ${pitReport.comments}` 
          : "No pit report comments."
        : <Loading size={24} />
    });

    if (!props.subjectiveReports) newComments.push({ match: 0.1, content: <Loading size={24} /> });
    else if (props.subjectiveReports.length === 0) newComments.push({ match: 0.1, content: "No subjective reports." });
    else {
      for (const report of props.subjectiveReports) {
        const submissionType = 
                          (report.submitted === SubjectiveReportSubmissionType.ByAssignedScouter 
                            ? "assigned" 
                            : report.submitted === SubjectiveReportSubmissionType.BySubjectiveScouter 
                              ? "subjective"
                              : "non-subjective") + " scouter";

        if (report.robotComments[props.selectedTeam ?? 0]) {
          newComments.push({
            match: (report.matchNumber ?? 0) + 0.2,
            content: 
            `Match ${report.matchNumber ?? "?"} (subjective, specific, by ${submissionType}): ${report.robotComments[props.selectedTeam ?? 0]}`
          });
        }

        if (report.wholeMatchComment) {
          newComments.push({
            match: (report.matchNumber ?? 0) + 0.1,
            content: 
            `Match ${report.matchNumber ?? "?"} (subjective, whole match, by ${submissionType}): ${report.wholeMatchComment}`
          });
        }
      }
    }

    const commentList = props.selectedReports.filter((report) => report.data.comments.length > 0);
    if (commentList.length === 0) return setComments([]);
    
    const promises = commentList.map((report) => api.findMatchById(report.match).then((match) => newComments.push({
      match: match.number,
      content: `Match ${match.number}: ${report.data.comments}`
    })));

    Promise.all(promises).then(() => setComments(newComments));
  }, [props.selectedTeam, props.selectedReports, props.subjectiveReports, props.pitReport]);

  if (!props.selectedTeam) {
    return (
      <div className="w-2/5 h-[700px] flex flex-col items-center justify-center bg-base-200">
        <h1 className="text-3xl text-accent animate-bounce font-semibold">
          Select A Team
        </h1>
      </div>
    );
  }

  const pitReport = props.pitReport;

  const defense = MostCommonValue("Defense", props.selectedReports);
  const intake = pitReport?.intakeType //MostCommonValue("IntakeType", props.selectedReports);
  const cooperates = BooleanAverage("Coopertition", props.selectedReports);
  const climbs = BooleanAverage("ClimbedStage", props.selectedReports);
  const parks = BooleanAverage("ParkedStage", props.selectedReports);
  const understage = BooleanAverage("UnderStage", props.selectedReports);
  const drivetrain = pitReport?.drivetrain;

  let defenseBadgeColor = "outline";
  if (defense === Defense.Full)
    defenseBadgeColor = "primary";
  else if (defense === Defense.Partial)
    defenseBadgeColor = "accent";

  let intakeBadgeColor = "outline";
  if (pitReport?.submitted) {
    if (intake === IntakeTypes.Both)
      intakeBadgeColor = "primary";
    else if (intake === IntakeTypes.Ground)
      intakeBadgeColor = "accent";
    else if (intake === IntakeTypes.Human)
      intakeBadgeColor = "secondary";
    else if (intake === IntakeTypes.None)
      intakeBadgeColor = "warning";
  }

  let drivetrainColor = "outline";
  if (pitReport?.submitted) {
    drivetrainColor = pitReport?.drivetrain === Drivetrain.Swerve ? "accent" : "warning";
  }

  return (
    <div className="w-2/5 h-fit flex flex-col bg-base-200 pl-10 py-4 text-sm">
      <h1 className="text-3xl text-accent font-semibold">
        Team #{props.selectedTeam}
      </h1>

      <div className="flex flex-row w-full space-x-2 space-y-1 mt-2 flex-wrap">
        <div className={`badge badge-${defenseBadgeColor}`}>
          {defense} Defense
        </div>
        <div className={`badge badge-${intakeBadgeColor}`}>
          {pitReport ? (pitReport.submitted ? intake : "Unknown") : <Loading size={12} className="mr-1" />} Intake
          { pitReport?.underBumperIntake && " (Under Bumper)" }
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
        { (!pitReport || pitReport.canScoreFromDistance) && 
          <div className={`badge badge-${pitReport?.canScoreFromDistance ? "primary" : "neutral"}`}>
            {pitReport ? (pitReport?.canScoreFromDistance && "Can Score from Distance") : <Loading size={12} />}
          </div>}
        <div className={`badge badge-${drivetrainColor}`}>
          {pitReport ? (pitReport.submitted ? drivetrain : "Unknown") : <Loading size={12} className="mr-1" />} Drivetrain
          {" "}{ pitReport && <>({pitReport.swerveLevel !== SwerveLevel.None && pitReport.swerveLevel + " "}{pitReport.motorType})</> }
        </div>
        { (!pitReport || pitReport.fixedShooter) && 
          <div className={`badge badge-${pitReport?.fixedShooter ? "error" : "neutral"}`}>
            {pitReport ? (pitReport?.fixedShooter && "Fixed Shooter") : <Loading size={12} />}
          </div>}
        { (!pitReport || pitReport.canScoreSpeaker) && 
          <div className={`badge badge-${pitReport?.canScoreSpeaker ? "secondary" : "neutral"}`}>
            {pitReport ? (pitReport?.canScoreSpeaker && "Can Score Speaker") : <Loading size={12} />}
          </div>}
        { (!pitReport || pitReport.canScoreAmp) && 
          <div className={`badge badge-${pitReport?.canScoreAmp ? "accent" : "neutral"}`}>
            {pitReport ? (pitReport?.canScoreAmp && "Can Score Amp") : <Loading size={12} />}
          </div>}
          { (!pitReport || pitReport.autoNotes > 0) && 
            <div className={`badge badge-${(pitReport?.autoNotes ?? 0) > 0 ? "primary" : "neutral"}`}>
              {pitReport ? <>Ideal Auto: {pitReport.autoNotes} notes</> : <Loading size={12} />}
            </div>}
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
                      .map((report) => <div key={report.match} className="mb-2">{report.content}</div>)
                }
              </li>
            : <Loading size={24} />
          }
        </ul>
      </div>
    </div>
  );
}
