import { Badge, Competition, Defense, Drivetrain, IntakeTypes, PitReportData, Pitreport, QuantitativeFormData, Report, SubjectiveReport, SwerveLevel } from "@/lib/Types";
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
import { Crescendo, games } from "@/lib/games";
import { GameId } from "@/lib/client/GameId";

function TeamCard(props: {
  number: number;
  rank: number;
  reports: Report[];
  pitReport: Pitreport | undefined;
  onClick: () => void;
  selected: boolean;
  compAvgPoints: number;
  compPointsStDev: number;
  getBadges: (pitData: Pitreport<PitReportData> | undefined, quantitativeData: Report<QuantitativeFormData>[]) => Badge[];
}) {
  const pitReport = props.pitReport;
  const data = pitReport?.data as PitReportData;

  const avgPoints = AveragePoints(props.reports);

  const badges = props.getBadges(pitReport, props.reports);

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
    drivetrainColor = data?.drivetrain === Drivetrain.Swerve ? "accent" : "warning";
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
          {badges.map((badge, index) => (
            <div key={index} className={`badge badge-sm badge-${badge.color}`}>{badge.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage(props: { reports: Report[], pitReports: Pitreport[], subjectiveReports: SubjectiveReport[], gameId: GameId }) {
  const reports = props.reports;
  const [pitReports, setPitReports] = useState<{ [key: number]: Pitreport }>({});
  const [teamReports, setTeamReports] = useState<{ [key: number]: Report[] }>(
    {}
  );
  const [teamSubjectiveReports, setTeamSubjectiveReports] = useState<{ [key: number]: SubjectiveReport[] }>({});

  const teamNumbers = Array.from(new Set([...Object.keys(teamReports), ...Object.keys(pitReports), ...Object.keys(teamSubjectiveReports)]));

  const [selectedTeam, setSelectedTeam] = useState<number>();
  const selectedReports = teamReports[selectedTeam ? selectedTeam : 0];
  
  const game = games[props.gameId];

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

    const newPitReports: typeof pitReports = {};
    props.pitReports.forEach((pitReport) => {
      newPitReports[pitReport.teamNumber] = pitReport;
    });
    setPitReports(newPitReports);

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
  const avgPoints = game.getAvgPoints(reports);
  const stDev = StandardDeviation(pointTotals);

  useEffect(() => {
    console.log("Associating teams...");
    associateTeams();
  }, [reports, props.pitReports, props.subjectiveReports]);

  // Associate pit reports
  props.pitReports.forEach((pitReport) => {
    pitReports[pitReport.teamNumber] = pitReport;
  });

  const teamRanking = Object.keys(teamReports).sort((a, b) => {
    const a1 = game.getAvgPoints(teamReports[Number(a)]);
    const b1 = game.getAvgPoints(teamReports[Number(b)]);
    return b1 - a1;
  });

  // Find teams not in team ranking
  const missingTeams = teamNumbers.filter((team) => !teamRanking.includes(team));

  return (
    <div className="w-full h-min flex flex-row space-x-4">
      <div className="w-1/5 h-[50rem] flex flex-col space-y-4 overflow-y-scroll">
        {teamRanking.concat(missingTeams).map((number, index) => (
          <TeamCard
            key={number}
            number={Number(number)}
            selected={selectedTeam === Number(number)}
            reports={teamReports[Number(number)] ?? []}
            pitReport={pitReports[Number(number)] ?? []}
            rank={index + 1}
            onClick={() => setSelectedTeam(Number(number))}
            compAvgPoints={avgPoints}
            compPointsStDev={stDev}
            getBadges={game.getBadges}
          />
        ))}
      </div>

      <TeamStats
        selectedReports={selectedReports}
        selectedTeam={selectedTeam}
        pitReport={pitReports[selectedTeam ?? 0]}
        subjectiveReports={teamSubjectiveReports[selectedTeam ?? 0]}
        getBadges={game.getBadges}
        layout={game.statsLayout}
      />

      <div className="w-5/12 h-full flex flex-col space-y-4">
        <div className="w-full h-[300px] flex flex-row justify-end mt-2">
          <div className="w-3/4 p-2 h-full bg-base-300 rounded-l-lg">
            <Summary selectedReports={selectedReports} />
          </div>

          <div className="w-[350px] h-[300px] float-right">
            <Heatmap selectedReports={selectedReports} fieldImagePrefix={game.fieldImagePrefix} />
          </div>
        </div>

        <SmallGraph selectedReports={selectedReports} team={selectedTeam ?? 0} />
      </div>
    </div>
  );
}
