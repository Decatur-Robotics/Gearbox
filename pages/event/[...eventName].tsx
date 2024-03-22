import { TheBlueAlliance } from "@/lib/TheBlueAlliance";
import { EventData } from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Container from "@/components/Container";
import { DateString } from "@/lib/client/FormatTime";
import { Statbotics } from "@/lib/Statbotics";
import { useEffect, useRef, useState } from "react";
import ClientAPI from "@/lib/client/ClientAPI";
import { FaX } from "react-icons/fa6";
import { start } from "repl";

const api = new ClientAPI("gearboxiscool");

export default function PublicEvent() {
  const { session, status } = useCurrentSession();
  const [eventData, setEventData] = useState<EventData | undefined | null>(
    null
  );
  const [teamEvents, setTeamEvents] = useState<Statbotics.TeamEvent[] | null>(
    null
  );
  const stateRef = useRef(eventData); // Ref used for fetch timeouts

  stateRef.current = eventData;

  const hide = status === "authenticated";

  useEffect(() => {
    const eventName = window.location.pathname.split("/event/")[1];
    if (eventData === null) {
      api.initialEventData(eventName).then((data) => {
        setEventData(data);
      });
      setTimeout(() => {
        console.log("Event not found");
        if (stateRef.current === null) {
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
            })
          )
      );
    }
  });

  // We must always have the same number of React hooks, so we generate refs even if we aren't using them yet
  const countdownRefs = {
    days: useRef<HTMLSpanElement>(null),
    hours: useRef<HTMLSpanElement>(null),
    minutes: useRef<HTMLSpanElement>(null),
    seconds: useRef<HTMLSpanElement>(null),
    label: useRef<HTMLSpanElement>(null),
  };

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

  if (eventData === undefined || eventData.firstRanking === undefined) {
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
  const first = eventData!.firstRanking;
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

  const startTime = new Date(eventData!.comp.start).getTime();
  const endTime = new Date(eventData!.comp.end).getTime();

  function getTimeLeft(): {
    time: number;
    label: string;
  } {
    const now = Date.now();
    let eventStatus = "upcoming";
    if (now > startTime) {
      eventStatus = "ongoing";
    }
    if (now > endTime) {
      eventStatus = "ended";
    }

    return {
      time: eventStatus === "upcoming" ? startTime - now : endTime - now,
      label:
        eventStatus === "upcoming"
          ? "Starts in"
          : eventStatus === "ongoing"
          ? "Ends in"
          : "Ended",
    };
  }

  function generateTimeLeft(
    timeLeft: number
  ): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    // Convert timeLeft to days, hours, minutes, seconds
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    timeLeft -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    timeLeft -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(timeLeft / (1000 * 60));
    timeLeft -= minutes * 1000 * 60;
    const seconds = Math.floor(timeLeft / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
    };
  }

  function updateCountdown() {
    const { time, label } = getTimeLeft();
    const { days, hours, minutes, seconds } = generateTimeLeft(time);

    if (countdownRefs.days.current) {
      countdownRefs.days.current.style.setProperty("--value", days.toString());
    }

    if (countdownRefs.hours.current) {
      countdownRefs.hours.current.style.setProperty(
        "--value",
        hours.toString()
      );
    }

    if (countdownRefs.minutes.current) {
      countdownRefs.minutes.current.style.setProperty(
        "--value",
        minutes.toString()
      );
    }

    if (countdownRefs.seconds.current) {
      countdownRefs.seconds.current.style.setProperty(
        "--value",
        seconds.toString()
      );
    }

    if (countdownRefs.label.current) {
      countdownRefs.label.current.innerText = label;
    }
  }

  updateCountdown();

  if (typeof window !== "undefined") {
    setInterval(updateCountdown, 1000);
  }

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      <div className="min-h-screen w-full max-sm:w-screen flex flex-col items-center justify-center space-y-6">
        <div className="card w-5/6 bg-base-200 shadow-xl mt-6">
          <div className="card-body min-h-1/2 w-full bg-accent rounded-t-lg"></div>
          <div className="card-body">
            <h2 className="card-title font-bold text-4xl">
              {eventData?.comp.name}
            </h2>
            {DateString(eventData!.comp.start)} -{" "}
            {DateString(eventData!.comp.end)}
            {Date.now() > startTime && Date.now() < endTime && (
              <div>
                <span ref={countdownRefs.label}></span>{" "}
                <div className="countdown">
                  {/*@ts-ignore*/}
                  <span
                    ref={countdownRefs.days}
                    { /*@ts-ignore */ ...
                    'style={{ "--value": 0 }}'}
                  ></span>
                  d{/*@ts-ignore*/}
                  <span
                    ref={countdownRefs.hours}
                    { /*@ts-ignore */ ...
                    'style={{ "--value": 0 }}'}
                  ></span>
                  h{/*@ts-ignore*/}
                  <span
                    ref={countdownRefs.minutes}
                    { /*@ts-ignore */ ...
                    'style={{ "--value": 0 }}'}
                  ></span>
                  m{/*@ts-ignore*/}
                  <span
                    ref={countdownRefs.seconds}
                    { /*@ts-ignore */ ...
                    'style={{ "--value": 0 }}'}
                  ></span>
                  s
                </div>
                <br />
                <progress
                  className="progress progress-secondary w-40"
                  value={Date.now() - startTime}
                  max={endTime - startTime}
                ></progress>
              </div>
            )}
          </div>
        </div>

        {Date.now() < startTime && (
          <div className="card w-5/6 shadow-xl bg-base-200 overflow-x-scroll">
            <div className="card-body items-center">
              <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
                <div className="flex flex-col">
                  <span className="countdown font-mono text-5xl">
                    {/*@ts-ignore*/}
                    <span
                      { /*@ts-ignore */ ...
                      'style={{ "--value": 0 }}'}
                      ref={countdownRefs.days}
                    ></span>
                  </span>
                  days
                </div>
                <div className="flex flex-col">
                  <span className="countdown font-mono text-5xl">
                    {/*@ts-ignore*/}
                    <span
                      { /*@ts-ignore */ ...
                      'style={{ "--value": 10 }}'}
                      ref={countdownRefs.hours}
                    ></span>
                  </span>
                  hours
                </div>
                <div className="flex flex-col">
                  <span className="countdown font-mono text-5xl">
                    {/*@ts-ignore*/}
                    <span
                      { /*@ts-ignore */ ...
                      'style={{ "--value": 24 }}'}
                      ref={countdownRefs.minutes}
                    ></span>
                  </span>
                  min
                </div>
                <div className="flex flex-col">
                  <span className="countdown font-mono text-5xl">
                    {/*@ts-ignore*/}
                    <span
                      { /*@ts-ignore */ ...
                      'style={{ "--value": 52 }}'}
                      ref={countdownRefs.seconds}
                    ></span>
                  </span>
                  sec
                </div>
              </div>
              <h2 className="card-title">until event starts</h2>
            </div>
          </div>
        )}

        {first.length > 0 ? (
          <div className="card w-5/6 bg-base-200 shadow-xl mt-6 overflow-x-scroll">
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
                    Publically available data combined with our statistics
                    engine
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
                          <td className="">
                            {ranking.team_key.split("frc")[1]}
                          </td>
                          <td className="">
                            {ranking.record.wins}-{ranking.record.ties}-
                            {ranking.record.losses}
                          </td>
                          <td>
                            {findStatboticsStats(
                              ranking.team_key
                            )?.record.qual.winrate.toFixed(2) ?? "..."}
                          </td>
                          <td>{oprs ? oprs![ranking.team_key].toFixed(2) : "?"}</td>
                          <td>
                            {findStatboticsStats(
                              ranking.team_key
                            )?.epa.total_points.mean.toFixed(2) ?? "..."}
                          </td>
                          <td>
                            {findStatboticsStats(
                              ranking.team_key
                            )?.epa.breakdown.teleop_points.mean.toFixed(2) ??
                              "..."}
                          </td>
                          <td>
                            {findStatboticsStats(
                              ranking.team_key
                            )?.epa.breakdown.auto_points.mean.toFixed(2) ??
                              "..."}
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
        ) : (
          <div className="card w-5/6 bg-base-200 shadow-xl mt-6">
            <div className="card-body">
              <h3 className="card-title font-bold text-3xl">No data.</h3>
              Check back later for rankings.
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
