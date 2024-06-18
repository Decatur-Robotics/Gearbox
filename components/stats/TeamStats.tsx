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
import { CrescendoPitReportData } from "@/lib/games";

const api = new ClientAPI("gearboxiscool");

export default function TeamStats(props: {
  selectedTeam: number | undefined;
  selectedReports: Report[];
  pitReport: Pitreport | null;
  subjectiveReports: SubjectiveReport[];
}) {
  const [comments, setComments] = useState<{matchNum: number, content: { order: number, jsx: ReactNode}[] }[] | null>(null);

  useEffect(() => {
    if(!props.selectedTeam) return;
    setComments(null);

    const newComments: typeof comments = [];

    function addComment(match: number, order: number, jsx: ReactNode) {
      if (!newComments!.some((comment) => comment.matchNum === match)) newComments!.push({ matchNum: match, content: [{
          order,
          jsx
        }] });
      else newComments!.find((comment) => comment.matchNum === match)!.content.push({ order, jsx });
    }

    addComment( 
      0,
      0,
      pitReport 
        ? pitReport.data?.comments.length ?? 0 > 0 
          ? `Pit Report: ${pitReport.data?.comments}` 
          : "No pit report comments."
        : <Loading size={24} />
    );

    if (!props.subjectiveReports) addComment(0, 0.1, <Loading size={24} />);
    else if (props.subjectiveReports.length === 0) addComment(0, 0.1, "No subjective reports.");
    else {
      for (const report of props.subjectiveReports) {
        const submissionType = 
                          (report.submitted === SubjectiveReportSubmissionType.ByAssignedScouter 
                            ? "assigned" 
                            : report.submitted === SubjectiveReportSubmissionType.BySubjectiveScouter 
                              ? "subjective"
                              : "non-subjective") + " scouter";

        if (report.robotComments[props.selectedTeam ?? 0]) {
          addComment(
            report.matchNumber ?? 0, 2,
            <span className="tooltip" data-tip={"By " + submissionType}>Subjective: {report.robotComments[props.selectedTeam ?? 0]}</span>
          );
        }

        if (report.wholeMatchComment) {
          addComment(
            report.matchNumber ?? 0, 1,
            <span className="tooltip" data-tip={"By " + submissionType}>Whole Match: {report.wholeMatchComment}</span>
          );
        }
      }
    }

    const commentList = props.selectedReports?.filter((report) => report.data?.comments.length > 0) ?? [];
    if (commentList.length === 0) return setComments([]);
    
    const promises = commentList.map((report) => api.findMatchById(report.match).then((match) => addComment(
      match.number, 0, `Quantitative: ${report.data?.comments}`
    )));

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
  const data = pitReport?.data as CrescendoPitReportData;

  const defense = MostCommonValue("Defense", props.selectedReports);
  const intake = data?.intakeType //MostCommonValue("IntakeType", props.selectedReports);
  const cooperates = BooleanAverage("Coopertition", props.selectedReports);
  const climbs = BooleanAverage("ClimbedStage", props.selectedReports);
  const parks = BooleanAverage("ParkedStage", props.selectedReports);
  const understage = BooleanAverage("UnderStage", props.selectedReports);
  const drivetrain = data?.drivetrain;

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
    drivetrainColor = data?.drivetrain === Drivetrain.Swerve ? "accent" : "warning";
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
          { data?.underBumperIntake && " (Under Bumper)" }
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
        { (!pitReport || data?.canScoreFromDistance) && 
          <div className={`badge badge-${data?.canScoreFromDistance ? "primary" : "neutral"}`}>
            {pitReport ? (data?.canScoreFromDistance && "Can Score from Distance") : <Loading size={12} />}
          </div>}
        <div className={`badge badge-${drivetrainColor}`}>
          {pitReport ? (pitReport.submitted ? drivetrain : "Unknown") : <Loading size={12} className="mr-1" />} Drivetrain
          {" "}{ pitReport && <>({data?.swerveLevel !== SwerveLevel.None && data?.swerveLevel + " "}{data?.motorType})</> }
        </div>
        { (!pitReport || data?.fixedShooter) && 
          <div className={`badge badge-${data?.fixedShooter ? "error" : "neutral"}`}>
            {pitReport ? (data?.fixedShooter && "Fixed Shooter") : <Loading size={12} />}
          </div>}
        { (!pitReport || data?.canScoreSpeaker) && 
          <div className={`badge badge-${data?.canScoreSpeaker ? "secondary" : "neutral"}`}>
            {pitReport ? (data?.canScoreSpeaker && "Can Score Speaker") : <Loading size={12} />}
          </div>}
        { (!pitReport || data?.canScoreAmp) && 
          <div className={`badge badge-${data?.canScoreAmp ? "accent" : "neutral"}`}>
            {pitReport ? (data?.canScoreAmp && "Can Score Amp") : <Loading size={12} />}
          </div>}
          { (!pitReport || data?.autoNotes > 0) && 
            <div className={`badge badge-${(data?.autoNotes ?? 0) > 0 ? "primary" : "neutral"}`}>
              {pitReport ? <>Ideal Auto: {data?.autoNotes} notes</> : <Loading size={12} />}
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
            ? comments.map((match) => match.matchNum > 0 
              ? (<li key={match.matchNum}>
                  <strong>Match {match.matchNum}</strong>
                  <ul className="pl-2">
                    {match.content.sort((a, b) => a.order - b.order).map((content, index) => (
                      <li key={index}>{content.jsx}</li>
                    ))}
                  </ul>
                </li>)
              : match.content.sort((a, b) => a.order - b.order).map((content, index) => (
                    <li key={index}>{content.jsx}</li>
                  ))
            )
            : <Loading size={24} />
          }
        </ul>
      </div>
    </div>
  );
}
