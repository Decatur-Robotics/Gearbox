import { Game, Report } from "@/lib/Types";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

function AllianceBuilder(props: { 
    teams: number[], 
    alliance: (number | undefined)[], 
    update: (index: number, team: number) => void,
    name: string,
    color: string
  }) {
  return (
    <div className="flex flex-col w-1/2">
      <h1 className={`text-${props.color} text-center`}>{props.name} Alliance</h1>
      <div className="flex flex-row items-stretch">
        {props.alliance.map((team, index) => 
          <select className="w-full select" value={team} onChange={(e) => props.update(index, parseInt(e.target.value))}>
            <option value={undefined}>Empty</option>
            {props.teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

export default function PredictionScreen(props: { reports: Report[], teams: number[], game: Game }) {
  const [reportsByTeam, setReportsByTeam] = useState<Record<number, Report[]>>({});

  // Array(length) constructor doesn't actually fill the array with undefined, so we have to do it manually
  const [blueAlliance, setBlueAlliance] = useState<(number | undefined)[]>(Array(props.game.allianceSize).fill(undefined));
  const [redAlliance, setRedAlliance] = useState<(number | undefined)[]>(Array(props.game.allianceSize).fill(undefined));

  useEffect(() => {
    const reportsByTeam = props.reports.reduce((acc, report) => {
      if (!acc[report.robotNumber]) {
        acc[report.robotNumber] = [];
      }

      acc[report.robotNumber].push(report);
      return acc;
    }, {} as Record<number, Report[]>);

    setReportsByTeam(reportsByTeam);
  }, [props.reports]);

  function updateAlliance(setAlliance: (alliance: (number | undefined)[]) => void, alliance: (number | undefined)[], 
      index: number, team: number) {
    alliance[index] = team;
    setAlliance([...alliance]); // We have to create a new array for the update to work
  }

  const blueAllianceFilled = blueAlliance.filter((team) => team !== undefined);
  const redAllianceFilled = redAlliance.filter((team) => team !== undefined);

  const avgPointsBlueAllianceIndividual = blueAllianceFilled.map((team) => props.game.getAvgPoints(reportsByTeam[team!]));
  const avgPointsRedAllianceIndividual = redAllianceFilled.map((team) => props.game.getAvgPoints(reportsByTeam[team!]));

  const avgPointsBlueAllianceTotal = avgPointsBlueAllianceIndividual.reduce((acc, points) => acc + points, 0);
  const avgPointsRedAllianceTotal = avgPointsRedAllianceIndividual.reduce((acc, points) => acc + points, 0);

  console.log(blueAlliance, blueAllianceFilled, avgPointsBlueAllianceIndividual);

  return (
    <div className="w-full h-fit flex flex-col space-y-2">
      <div className="flex flex-row w-full">
        <AllianceBuilder teams={props.teams} alliance={blueAlliance} 
          update={(index, team) => updateAlliance(setBlueAlliance, blueAlliance, index, team)} name="Blue" color="blue-500" />
        <AllianceBuilder teams={props.teams} alliance={redAlliance} 
          update={(index, team) => updateAlliance(setRedAlliance, redAlliance, index, team)} name="Red" color="red-500" />
      </div>
      <div className="flex flex-row w-full">
        <Bar 
          data={{
            datasets: [
              ({
                data: avgPointsBlueAllianceIndividual
                        .concat(avgPointsRedAllianceIndividual)
                        .concat([avgPointsBlueAllianceTotal, avgPointsRedAllianceTotal]),
                label: "Average Points",
                backgroundColor: Array(blueAllianceFilled.length).fill("blue")
                                  .concat(Array(redAllianceFilled.length).fill("red"))
                                  .concat(["blue", "red"]),
              })
            ],
            labels: blueAllianceFilled.concat(redAllianceFilled).map((team) => team!.toString()).concat(["Blue Alliance", "Red Alliance"]),
          }} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
          }}
          height={"450px"}
        />
      </div>
    </div>
  );
}