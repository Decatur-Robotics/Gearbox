import { Competition, Defense, IntakeTypes, Report } from "@/lib/Types";
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

function TeamCard(props: {
  number: number;
  rank: number;
  reports: Report[];
  onClick: () => void;
  selected: boolean;
  compAvgPoints: number;
  compPointsStDev: number;
}) {
  const avgPoints = AveragePoints(props.reports);
  const defense = MostCommonValue("Defense", props.reports);
  const intake = MostCommonValue("IntakeType", props.reports);
  const cooperates = BooleanAverage("Coopertition", props.reports);
  const climbs = BooleanAverage("ClimbedStage", props.reports);
  const parks = BooleanAverage("ParkedStage", props.reports);
  const understage = BooleanAverage("UnderStage", props.reports);

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
          <div className={`badge badge-${badgeColor} text-2xl p-3`}>{props.rank}st</div>
        </h2>
        <p>Avg Points: {avgPoints} ({pointsDiffFromAvgFormatted})</p>
        <div className="card-actions">
          <div className={`badge badge-sm badge-${defenseBadgeColor}`}>
            {defense} Defense
          </div>
          <div className={`badge badge-sm badge-${intakeBadgeColor}`}>
            {intake} Intake
          </div>
          { cooperates &&
            <div className="badge badge-sm badge-primary">Cooperates</div>}
          { climbs &&
            <div className="badge badge-sm badge-secondary">Climbs</div>}
          { parks &&
            <div className="badge badge-sm badge-accent">Parks</div>}
          { understage &&
            <div className="badge badge-sm badge-neutral">Small Profile</div>}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage(props: { reports: Report[] }) {
  const reports = props.reports;

  const [associatingTeams, setAssociatingTeams] = useState(true);
  const [teamReports, setTeamReports] = useState<{ [key: number]: Report[] }>(
    {}
  );
  const teamNumbers = Object.keys(teamReports);

  const [teamRanking, setTeamRanking] = useState<string[]>([]);

  const [selectedTeam, setSelectedTeam] = useState<number>();
  const selectedReports = teamReports[selectedTeam ? selectedTeam : 0];

  const associateTeams = () => {
    setAssociatingTeams(true);

    reports.forEach((report) => {
      if (!(report.robotNumber in teamReports)) {
        teamReports[report.robotNumber] = [report];
      } else {
        teamReports[report.robotNumber].push(report);
      }
    });

    setAssociatingTeams(false);
  };

  const pointTotals = reports.map((report) => TotalPoints([report]));
  const avgPoints = AveragePoints(reports);
  const stDev = StandardDeviation(pointTotals);

  console.log("Average Points: ", avgPoints);
  console.log("Standard Deviation: ", stDev);

  const rankTeams = () => {
    const ranked = Object.keys(teamReports).sort((a, b) => {
      const a1 = AveragePoints(teamReports[Number(a)]);
      const b1 = AveragePoints(teamReports[Number(b)]);
      if (a1 < b1) {
        return 1;
      } else if (a1 > b1) {
        return -1;
      }
      return 0;
    });
    setTeamRanking(ranked);
  };

  useEffect(() => {
    if (teamNumbers.length < 1) {
      associateTeams();
      rankTeams();
    }
  });

  return (
    <div className="w-full h-full flex flex-row space-x-4">
      <div className="w-1/5 h-[50rem] flex flex-col space-y-4 overflow-y-scroll">
        {teamRanking.map((number, index) => (
          <TeamCard
            key={number}
            number={Number(number)}
            selected={selectedTeam === Number(number)}
            reports={teamReports[Number(number)]}
            rank={index + 1}
            onClick={() => {
              setSelectedTeam(Number(number));
            }}
            compAvgPoints={avgPoints}
            compPointsStDev={stDev}
          ></TeamCard>
        ))}
      </div>

      <TeamStats
        selectedReports={selectedReports}
        selectedTeam={selectedTeam}
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

        <SmallGraph selectedReports={selectedReports}></SmallGraph>
      </div>
    </div>
  );
}
