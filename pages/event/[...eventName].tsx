import { TheBlueAlliance } from "@/lib/TheBlueAlliance";
import { GetServerSideProps } from "next";
import { Competition } from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Container from "@/components/Container";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";
import { DateString, TimeString } from "@/lib/client/FormatTime";
import { Statbotics } from "@/lib/Statbotics";

const tba = new TheBlueAlliance.Interface();

export default function PublicEvent(props: {
  comp: Competition;
  firstRanking: TheBlueAlliance.SimpleRank[];
  oprRanking: TheBlueAlliance.OprRanking;
  statbotics: Statbotics.TeamEvent[];
}) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  const oprs = props.oprRanking.oprs;
  //@ts-ignore
  const first = props.firstRanking;
  const statbotics = props.statbotics;

  const findStatboticsStats = (key: string) => {
    var stats: Statbotics.TeamEvent | undefined;
    statbotics.forEach((s) => {
      if (s.team == Number(key.split("frc")[1])) {
        stats = s;
      }
    });

    return stats;
  };

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
        <div className="card w-5/6 bg-base-200 shadow-xl mt-6">
          <div className="card-body min-h-1/2 w-full bg-accent rounded-t-lg"></div>
          <div className="card-body">
            <h2 className="card-title font-bold text-4xl">{props.comp.name}</h2>
            {DateString(props.comp.start)} - {DateString(props.comp.end)}
          </div>
        </div>

        <div className="card w-5/6 bg-base-200 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title font-bold text-4xl">Ranking</h2>
            <div className="w-full h-full flex flex-row">
              <div className="w-full h-full">
                <h1 className="text-lg font-semibold">Composite Ranking</h1>
                <h1 className="italic">
                  Publically available data combined with our statistics engine
                </h1>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team </th>
                      <th>Record</th>
                      <th>Win Rate</th>
                      <th>OPR</th>
                      <th>EPA</th>
                      <th>Teleop Points</th>
                      <th>Auto Points</th>
                      <th>Ranking Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {first.map((ranking: any, index: number) => (
                      <tr key={ranking.team_key}>
                        <th>
                          {
                            findStatboticsStats(ranking.team_key)?.record.qual
                              .rank
                          }
                        </th>
                        <td className="">{ranking.team_key.split("frc")[1]}</td>
                        <td className="">
                          {ranking.record.wins}-{ranking.record.ties}-
                          {ranking.record.losses}
                        </td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.record.qual.winrate.toFixed(2)}
                        </td>
                        <td>{oprs[ranking.team_key].toFixed(2)}</td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.epa.total_points.mean.toFixed(2)}
                        </td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.epa.breakdown.teleop_points.mean.toFixed(2)}
                        </td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.epa.breakdown.auto_points.mean.toFixed(2)}
                        </td>
                        <td className="">{ranking.extra_stats}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const eventKey = context.resolvedUrl.split("/event/")[1];

  // Start promises
  const compRankingsPromise = tba.req.getCompetitonRanking(eventKey);
  const eventInformationPromise = tba.getCompetitionAutofillData(eventKey);
  const tbaOPRPromise = tba.req.getCompetitonOPRS(eventKey);

  await compRankingsPromise;
  const firstRanking = (await compRankingsPromise).rankings;

  async function getStatboticsData(): Promise<Statbotics.TeamEvent[]> {
    const promises = firstRanking.map(({ team_key }) =>
      Statbotics.getTeamEvent(eventKey, team_key.split("frc")[1]),
    );

    return Promise.all(promises);
  }
  const statboticsPromise = getStatboticsData();

  const eventInformation = await eventInformationPromise;
  const tbaOPR = await tbaOPRPromise;
  const statbotics = await statboticsPromise;

  return {
    props: {
      comp: JSON.parse(JSON.stringify(eventInformation)),
      firstRanking: firstRanking,
      oprRanking: tbaOPR,
      statbotics: statbotics,
    },
  };
};
