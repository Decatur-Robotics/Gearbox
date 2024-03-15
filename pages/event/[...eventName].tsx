import { TheBlueAlliance } from "@/lib/TheBlueAlliance";
import { EventData } from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Container from "@/components/Container";
import { DateString } from "@/lib/client/FormatTime";
import { Statbotics } from "@/lib/Statbotics";
import { useEffect, useState } from "react";
import ClientAPI from "@/lib/client/ClientAPI";
import { FaX } from "react-icons/fa6";

const api = new ClientAPI("gearboxiscool");

export default function PublicEvent() {
  const { session, status } = useCurrentSession();
  const [eventData, setEventData] = useState<EventData | undefined | null>(
    null,
  );
  const [teamEvents, setTeamEvents] = useState<Statbotics.TeamEvent[] | null>(
    null,
  );
  const hide = status === "authenticated";

  useEffect(() => {
    const eventName = window.location.pathname.split("/event/")[1];
    if (eventData === null) {
      api.initialEventData(eventName).then((data) => {
        setEventData(data);
      });
      setTimeout(() => {
        console.log("Event not found");
        if (eventData === null) {
          console.log("Event is null");
          setEventData(undefined);
        }
      }, 10000);
    } else if (teamEvents === null) {
      const firstRanking = eventData?.firstRanking;

      firstRanking?.map(({ team_key }) =>
        api
          .statboticsTeamEvent(eventName, team_key.split("frc")[1])
          .then((teamEvent: Statbotics.TeamEvent) =>
            setTeamEvents((prev) => {
              if (prev === null) {
                return [teamEvent];
              } else {
                return [...prev, teamEvent];
              }
            }),
          ),
      );
    }
  });

  if (eventData === null) {
    return (
      <Container requireAuthentication={false} hideMenu={!hide}>
        <div className=" min-h-[65vh] flex flex-col items-center justify-center space-y-6">
          <div className="loading loading-spinner loading-lg"></div>
          <div className="text-4xl font-bold">Loading...</div>
        </div>
      </Container>
    );
  }

  if (eventData === undefined) {
    return (
      <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="min-h-[65vh] flex flex-col items-center justify-center space-y-6">
          <FaX size={48} color="red" />
          <div className="text-4xl font-bold">Error: Event not found</div>
        </div>
      </Container>
    );
  }

  const oprs = eventData!.oprRanking.oprs;
  //@ts-ignore
  const first = eventData.firstRanking;
  const statbotics = teamEvents ?? [];

  const findStatboticsStats = (key: string) => {
    var stats: Statbotics.TeamEvent | undefined;
    statbotics.forEach((s: Statbotics.TeamEvent | undefined) => {
      if (s?.team == Number(key.split("frc")[1])) {
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
            <h2 className="card-title font-bold text-4xl">
              {eventData?.comp.name}
            </h2>
            {DateString(eventData!.comp.start)} -{" "}
            {DateString(eventData!.comp.end)}
          </div>
        </div>

        <div className="card w-5/6 bg-base-200 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title font-bold text-4xl">Ranking</h2>
            {statbotics.length < first.length && (
              <progress
                className="progress progress-primary w-100%"
                value={statbotics.length}
                max={first.length}
              ></progress>
            )}
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
                          {findStatboticsStats(ranking.team_key)?.record.qual
                            .rank ?? "..."}
                        </th>
                        <td className="">{ranking.team_key.split("frc")[1]}</td>
                        <td className="">
                          {ranking.record.wins}-{ranking.record.ties}-
                          {ranking.record.losses}
                        </td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.record.qual.winrate.toFixed(2) ?? "..."}
                        </td>
                        <td>{oprs![ranking.team_key].toFixed(2)}</td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.epa.total_points.mean.toFixed(2) ?? "..."}
                        </td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.epa.breakdown.teleop_points.mean.toFixed(2) ??
                            "..."}
                        </td>
                        <td>
                          {findStatboticsStats(
                            ranking.team_key,
                          )?.epa.breakdown.auto_points.mean.toFixed(2) ?? "..."}
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
