import { Competition, Defense, Drivetrain, IntakeTypes, Pitreport, Report, SubjectiveReport, SwerveLevel } from "@/lib/Types";
import { useEffect, useState } from "react";

import {
  AveragePoints,
  MostCommonValue,
  BooleanAverage,
  StandardDeviation,
  TotalPoints,
  Round,
} from "@/lib/client/StatsMath";

import Heatmap from "@/components/stats/Heatmap";
import TeamStats from "@/components/stats/TeamStats";
import Summary from "@/components/stats/Summary";
import SmallGraph from "@/components/stats/SmallGraph";
import Loading from "../Loading";

function TeamCard(props: {
  number: number;
  rank: number;
  reports: Report[];
  pitReport: Pitreport | undefined;
  onClick: () => void;
  selected: boolean;
  compAvgPoints: number;
  compPointsStDev: number;
}) {
  const pitReport = props.pitReport;

  const avgPoints = AveragePoints(props.reports);
  const defense = MostCommonValue("Defense", props.reports);
  const intake = pitReport?.intakeType; //MostCommonValue("IntakeType", props.reports);
  const cooperates = BooleanAverage("Coopertition", props.reports);
  const climbs = BooleanAverage("ClimbedStage", props.reports);
  const parks = BooleanAverage("ParkedStage", props.reports);
  const understage = BooleanAverage("UnderStage", props.reports);
  const drivetrain = pitReport?.drivetrain ?? (
    <Loading size={12} bg="" fill="text-base-300" className="mr-1" />
  );

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

  const pointsDiffFromAvg = Round(avgPoints - props.compAvgPoints);
  const pointsDiffFromAvgFormatted = pointsDiffFromAvg > 0 ? `+${pointsDiffFromAvg}` : pointsDiffFromAvg;

  let textColor = "info";
  if (pointsDiffFromAvg > props.compPointsStDev) {
    textColor = "primary";
  }
  else if (pointsDiffFromAvg > props.compPointsStDev / 2) {
    textColor = "accent";
  } else if (pointsDiffFromAvg < -props.compPointsStDev) {
    textColor = "warning";
  }

  let badgeColor = "neutral";
  if (props.rank === 1) {
    badgeColor = "primary";
  }
  else if (props.rank === 2) {
    badgeColor = "secondary";
  }
  else if (props.rank === 3) {
    badgeColor = "accent";
  }

  let rankSuffix = "th";
  if (props.rank === 1) {
    rankSuffix = "st";
  }
  else if (props.rank === 2) {
    rankSuffix = "nd";
  }
  else if (props.rank === 3) {
    rankSuffix = "rd";
  }

  let drivetrainColor = "outline";
  if (pitReport?.submitted) {
    drivetrainColor = pitReport?.drivetrain === Drivetrain.Swerve ? "accent" : "warning";
  }

  return (
    <div
      className={`card w-full bg-base-300 py-0 ${
        props.selected ? "border-2 border-primary" : ""
      } hover:border-2 hover:border-primary`}
      onClick={props.onClick}
    >
      <div className="card-body">
        <h2 className={`card-title text-xl text-${textColor}`}>
          <span className={`${props.rank === 1 && "drop-shadow-glowStrong"}`}>#{props.number}</span>
          <div className={`badge badge-${badgeColor} text-2xl p-3`}>{props.rank}{rankSuffix}</div>
        </h2>
        <p>Avg Points: {avgPoints}{" "}
          <span className="tooltip" data-tip="Difference from comp-wide average">({pointsDiffFromAvgFormatted})</span>
        </p>
        <div className="card-actions">
          <div className={`badge badge-sm badge-${defenseBadgeColor}`}>
            {defense} Defense
          </div>
          <div className={`badge badge-sm badge-${intakeBadgeColor}`}>
            {pitReport ? (pitReport.submitted ? intake : "Unknown") : <Loading size={12} className="mr-1" />} Intake
            { pitReport?.underBumperIntake && " (Under Bumper)" }
          </div>
          { cooperates &&
            <div className="badge badge-sm badge-primary">Cooperates</div>}
          { climbs &&
            <div className="badge badge-sm badge-secondary">Climbs</div>}
          { parks &&
            <div className="badge badge-sm badge-accent">Parks</div>}
          { understage &&
            <div className="badge badge-sm badge-neutral">Small Profile</div>}
          { (!pitReport || pitReport.canScoreFromDistance) && 
            <div className={`badge badge-sm badge-${pitReport?.canScoreFromDistance ? "primary" : "neutral"}`}>
              {pitReport ? (pitReport?.canScoreFromDistance && "Can Score from Distance") : <Loading size={12} />}
            </div>}
          { drivetrain && 
              <div className={`badge badge-sm badge-${drivetrainColor}`}>
                {pitReport ? (pitReport?.submitted ? drivetrain : "Unknown") : <Loading size={12} className="mr-1" />} Drivetrain
                {" "}{ pitReport && <>({pitReport.swerveLevel !== SwerveLevel.None && pitReport.swerveLevel + " "}{pitReport.motorType})</> }
              </div>}
          { (!pitReport || pitReport.fixedShooter) && 
            <div className={`badge badge-sm badge-${pitReport?.fixedShooter ? "error" : "neutral"}`}>
              {pitReport ? (pitReport?.fixedShooter && "Fixed Shooter") : <Loading size={12} />}
            </div>}
          { (!pitReport || pitReport.canScoreSpeaker) && 
            <div className={`badge badge-sm badge-${pitReport?.canScoreSpeaker ? "secondary" : "neutral"}`}>
              {pitReport ? (pitReport?.canScoreSpeaker && "Can Score Speaker") : <Loading size={12} />}
            </div>}
          { (!pitReport || pitReport.canScoreAmp) && 
            <div className={`badge badge-sm badge-${pitReport?.canScoreAmp ? "accent" : "neutral"}`}>
              {pitReport ? (pitReport?.canScoreAmp && "Can Score Amp") : <Loading size={12} />}
            </div>}
            
          { (!pitReport || pitReport.canScoreSpeaker) && 
            <div className={`badge badge-sm badge-${pitReport?.canScoreSpeaker ? "primary" : "neutral"}`}>
              {pitReport ? (pitReport?.canScoreSpeaker && "Can Score Speaker") : <Loading size={12} />}
            </div>}
          { (!pitReport || pitReport.autoNotes > 0) && 
            <div className={`badge badge-sm badge-${(pitReport?.autoNotes ?? 0) > 0 ? "primary" : "neutral"}`}>
              {pitReport ? <>Ideal Auto: {pitReport.autoNotes} notes</> : <Loading size={12} />}
            </div>}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage(props: { reports: Report[], pitReports: Pitreport[], subjectiveReports: SubjectiveReport[] }) {
  const reports = props.reports;
  const pitReports: { [key: number]: Pitreport } = {};
  const [teamReports, setTeamReports] = useState<{ [key: number]: Report[] }>(
    {}
  );
  const [teamSubjectiveReports, setTeamSubjectiveReports] = useState<{ [key: number]: SubjectiveReport[] }>({});

  const teamNumbers = Object.keys(teamReports);

  const [selectedTeam, setSelectedTeam] = useState<number>();
  const selectedReports = teamReports[selectedTeam ? selectedTeam : 0];

  const associateTeams = () => {
    const newTeamReports: typeof teamReports = {};
    reports.forEach((report) => {
      if (!(report.robotNumber in newTeamReports)) {
        newTeamReports[report.robotNumber] = [report];
      } else {
        newTeamReports[report.robotNumber].push(report);
      }
    });
    setTeamReports(newTeamReports);
  };

  useEffect(() => {
    const subjectiveReports: typeof teamSubjectiveReports = {};
    props.subjectiveReports.forEach((subjectiveReport) => {
      for (const teamNumber of Object.keys(subjectiveReport.robotComments)) {
        if (!Object.keys(subjectiveReports).includes(teamNumber)) {
          subjectiveReports[Number(teamNumber)] = [subjectiveReport];
        } else {
          subjectiveReports[Number(teamNumber)].push(subjectiveReport);
        }
      }
    });
    setTeamSubjectiveReports(subjectiveReports);
  }, [props.subjectiveReports]);

  const pointTotals = reports.map((report) => TotalPoints([report]));
  const avgPoints = AveragePoints(reports);
  const stDev = StandardDeviation(pointTotals);

  useEffect(() => {
      associateTeams();
  }, [reports]);

  // Associate pit reports
  props.pitReports.forEach((pitReport) => {
    pitReports[pitReport.teamNumber] = pitReport;
  });

  const teamRanking = Object.keys(teamReports).sort((a, b) => {
    const a1 = AveragePoints(teamReports[Number(a)]);
    const b1 = AveragePoints(teamReports[Number(b)]);
    if (a1 < b1) {
      return 1;
    } else if (a1 > b1) {
      return -1;
    }
    return 0;
  });

  return (
    <div className="w-full h-min flex flex-row space-x-4">
      <div className="w-1/5 h-[50rem] flex flex-col space-y-4 overflow-y-scroll">
        {teamRanking.map((number, index) => (
          <TeamCard
            key={number}
            number={Number(number)}
            selected={selectedTeam === Number(number)}
            reports={teamReports[Number(number)]}
            pitReport={pitReports[Number(number)]}
            rank={index + 1}
            onClick={() => setSelectedTeam(Number(number))}
            compAvgPoints={avgPoints}
            compPointsStDev={stDev}
          ></TeamCard>
        ))}
      </div>

      <TeamStats
        selectedReports={selectedReports}
        selectedTeam={selectedTeam}
        pitReport={pitReports[selectedTeam ?? 0]}
        subjectiveReports={teamSubjectiveReports[selectedTeam ?? 0]}
      ></TeamStats>

      <div className="w-5/12 h-full flex flex-col space-y-4">
        <div className="w-full h-[300px] flex flex-row justify-end mt-2">
          <div className="w-3/4 p-2 h-full bg-base-300 rounded-l-lg">
            <Summary selectedReports={selectedReports}></Summary>
          </div>

          <div className="w-[350px] h-[300px] float-right">
            <Heatmap selectedReports={selectedReports}></Heatmap>
          </div>
        </div>

        <SmallGraph selectedReports={selectedReports} team={selectedTeam ?? 0}></SmallGraph>
      </div>
    </div>
  );
}
