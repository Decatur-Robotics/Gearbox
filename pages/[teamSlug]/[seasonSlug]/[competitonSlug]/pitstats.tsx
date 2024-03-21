import Container from "@/components/Container";
import BarGraph from "@/components/stats/Graph";
import { Competition, Pitreport, Report } from "@/lib/Types";
import { ResolvedUrlData, SerializeDatabaseObject } from "@/lib/UrlResolver";
import UrlResolver from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { BsGearFill } from "react-icons/bs";

import ClientAPI from "@/lib/client/ClientAPI";
import { useEffect, useRef, useState } from "react";
import { Collections, GetDatabase } from "@/lib/MongoDB";
import { NumericalAverage } from "@/lib/client/StatsMath";
import useIsVisible from "@/lib/client/useIsVisible";

const api = new ClientAPI("gearboxiscool");

type TeamReportPair = { [key: number]: Report[] };
type TeamStatPair = {
  [key: number]: {
    avgTeleop: number;
    avgAuto: number;
    avgSpeaker: number;
    avgAmp: number;
  };
};
type PitReportPair = { [team: number]: Pitreport };

function TeamSlide(props: {
  teamNumber: number;
  teamStatPairs: TeamStatPair;
  avgTeleop: string[];
  avgAuto: string[];
  avgSpeaker: string[];
  avgAmp: string[];
  pitReport: Pitreport;
}) {
  const [visible, setVisible] = useState(false);
  const stats = props.teamStatPairs[props.teamNumber];
  const length = props.avgTeleop.length;
  const pit = props.pitReport;

  useEffect(() => {
    setVisible(true);
    return () => {
      setVisible(false);
    };
  }, []);

  return (
    <div
      key={props.teamNumber}
      className={`w-full h-full bg-base-200 rounded-xl flex flex-row p-8 transition ease-in ${
        visible ? "translate-x-0" : "translate-x-96"
      }`}
    >
      <div className="w-1/2">
        <h1 className="font-bold text-5xl text-accent">
          Team {props.teamNumber}
        </h1>
        <h2 className="font-mono">Scouting + Pit-scouting data</h2>
        <div className="flex flex-row space-x-2">
          {pit?.canClimb ? (
            <div className="badge badge-primary">Can Climb</div>
          ) : (
            <></>
          )}
          {pit?.canScoreSpeaker ? (
            <div className="badge badge-secondary">Can Score Speaker</div>
          ) : (
            <></>
          )}
          {pit?.canScoreAmp ? (
            <div className="badge badge-accent">Can Score Amp</div>
          ) : (
            <></>
          )}
        </div>

        <div className="divider w-1/2"></div>
        <h1 className="text-xl font-semibold">Quick-view Stats:</h1>
        <p className="ml-4 text-lg font-mono ">Basic insights into teams</p>
        <div className="mt-4 text-lg">
          <p>
            Average Teleop Points: {stats.avgTeleop}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgTeleop.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
          <p>
            Average Auto Points: {stats.avgAuto}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgAuto.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
          <p>
            Average Speaker Points: {stats.avgSpeaker}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgSpeaker.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
          <p>
            Average Amp Points: {stats.avgAmp}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgAmp.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
        </div>
      </div>
      <div className="w-1/2 flex flex-col">
        {pit.image !== "/robot.jpg" ? (
          <img src={pit.image} className="rounded-xl w-[300px] h-64"></img>
        ) : (
          <div className="skeleton bg-base-300 w-[300px] h-64 rounded-xl"></div>
        )}
        <h1 className="text-lg font-semibold">Robot Capabilities:</h1>
        <p className="text-lg">
          Intake Type: <span className="text-accent">{pit.intakeType}</span>
        </p>
        <p className="text-lg">
          Drivetrain: <span className="text-accent">{pit.drivetrain}</span>
        </p>
      </div>
    </div>
  );
}

export default function Pitstats(props: { competition: Competition }) {
  const comp = props.competition;
  const [reports, setReports] = useState<Report[]>([]);
  const [pitReports, setPitReports] = useState<PitReportPair>({});
  const [teamReportPairs, setTeamReportPairs] = useState<TeamReportPair>({});
  const [teamStatPairs, setTeamStatPairs] = useState<TeamStatPair>({});

  const [avgTeleop, setAvgTeleop] = useState<string[]>([]);
  const [avgAuto, setAvgAuto] = useState<string[]>([]);
  const [avgAmp, setAvgAmp] = useState<string[]>([]);
  const [avgSpeaker, setAvgSpeaker] = useState<string[]>([]);

  const [slides, setSlides] = useState<React.JSX.Element[]>([]);
  const [currentSlide, setCurrentSlide] = useState(-1);

  const loadReports = async () => {
    const newReports = (await api.competitionReports(
      comp._id,
      true
    )) as Report[];

    var newPairs: TeamReportPair = {};
    newReports.forEach((report) => {
      const n = report.robotNumber;
      if (!Object.keys(newPairs).includes(n.toString())) {
        newPairs[n] = [report];
      } else {
        newPairs[n].push(report);
      }
    });

    var newStatPairs: TeamStatPair = {};
    Object.keys(newPairs).forEach((key) => {
      const teamReports = newPairs[Number(key)];
      newStatPairs[Number(key)] = {
        avgTeleop:
          NumericalAverage("TeleopScoredSpeaker", teamReports) +
          NumericalAverage("TeleopScoredAmp", teamReports),
        avgAuto:
          NumericalAverage("AutoScoredSpeaker", teamReports) +
          NumericalAverage("AutoScoredAuto", teamReports),
        avgAmp:
          NumericalAverage("TeleopScoredAmp", teamReports) +
          NumericalAverage("AutoScoredAmp", teamReports),
        avgSpeaker:
          NumericalAverage("TeleopScoredSpeaker", teamReports) +
          NumericalAverage("AutoScoredSpeaker", teamReports),
      };
    });

    setAvgTeleop(
      Object.keys(newStatPairs).sort((a, b) => {
        const as = newStatPairs[Number(a)];
        const bs = newStatPairs[Number(b)];

        if (as?.avgTeleop < bs?.avgTeleop) {
          return 1;
        } else if (as?.avgTeleop > bs?.avgTeleop) {
          return -1;
        }

        return 0;
      })
    );

    setAvgAuto(
      Object.keys(newStatPairs).sort((a, b) => {
        const as = newStatPairs[Number(a)];
        const bs = newStatPairs[Number(b)];

        if (as?.avgAuto < bs?.avgAuto) {
          return 1;
        } else if (as?.avgAuto > bs?.avgAuto) {
          return -1;
        }

        return 0;
      })
    );

    setAvgSpeaker(
      Object.keys(newStatPairs).sort((a, b) => {
        const as = newStatPairs[Number(a)];
        const bs = newStatPairs[Number(b)];

        if (as?.avgSpeaker < bs?.avgSpeaker) {
          return 1;
        } else if (as?.avgSpeaker > bs?.avgSpeaker) {
          return -1;
        }

        return 0;
      })
    );

    setAvgAmp(
      Object.keys(newStatPairs).sort((a, b) => {
        const as = newStatPairs[Number(a)];
        const bs = newStatPairs[Number(b)];

        if (as?.avgAmp < bs?.avgAmp) {
          return 1;
        } else if (as?.avgAmp > bs?.avgAmp) {
          return -1;
        }

        return 0;
      })
    );

    var newPits: PitReportPair = {};
    for (var rid of comp?.pitReports) {
      const c = await api.findPitreportById(rid);
      newPits[c.teamNumber] = c;
    }

    var newSlides = Object.keys(newStatPairs).map((key) => (
      <TeamSlide
        key={key}
        teamNumber={Number(key)}
        teamStatPairs={newStatPairs}
        avgTeleop={avgTeleop}
        avgAmp={avgAmp}
        avgAuto={avgAuto}
        avgSpeaker={avgSpeaker}
        pitReport={newPits[Number(key)]}
      ></TeamSlide>
    ));
    setSlides(newSlides);
    setReports(newReports);
    setTeamReportPairs(newPairs);
    setTeamStatPairs(newStatPairs);
    setPitReports(newPits);
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      loadReports();
    }, 60 * 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((n) => (n < slides.length - 1 ? n + 1 : -1));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides]);

  return (
    <Container hideMenu={true} requireAuthentication={true}>
      <div className="w-full h-full flex flex-col items-center bg-base-300">
        <h1 className="text-4xl font-bold text-center mt-2 ">
          <BsGearFill className="inline animate-spin-slow"></BsGearFill> Gearbox
          Pit-Stats
        </h1>
        <p className="font-mono font-semibold">
          Showing <span className="text-accent">live data</span>
          <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse inline-block mx-2 translate-y-1"></div>
          from our <span className="text-accent">22 active scouters</span>
        </p>

        <div className="btn btn-primary font-bold mt-2 ">
          Learn more: https://4026.org
        </div>

        <progress
          className="progress progress-primary h-4 w-2/3 mt-2 "
          value={(currentSlide / slides.length) * 100}
          max="100"
        ></progress>

        {Object.keys(teamStatPairs).length === 0 ? (
          <h1>Loading...</h1>
        ) : (
          <div className="w-3/4 h-2/3 flex flex-row p-2">
            {currentSlide === -1 ? (
              <div className="w-full h-full bg-base-200 grid grid-cols-2 grid-rows-2 gap-0 rounded-xl">
                <BarGraph
                  label="Teleop Points"
                  xlabels={avgTeleop}
                  data={avgTeleop.map(
                    (key) => teamStatPairs[Number(key)].avgTeleop
                  )}
                ></BarGraph>
                <BarGraph
                  label="Auto Points"
                  xlabels={avgAuto}
                  data={avgAuto.map(
                    (key) => teamStatPairs[Number(key)].avgAuto
                  )}
                ></BarGraph>
                <BarGraph
                  label="Overall Speaker Points"
                  xlabels={avgSpeaker}
                  data={avgSpeaker.map(
                    (key) => teamStatPairs[Number(key)].avgSpeaker
                  )}
                ></BarGraph>
                <BarGraph
                  label="Overall Amp Points"
                  xlabels={avgAmp}
                  data={avgAmp.map((key) => teamStatPairs[Number(key)].avgAmp)}
                ></BarGraph>
              </div>
            ) : (
              slides[currentSlide]
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();
  const compSlug = context.resolvedUrl.split("/")[3];
  const comp = await db.findObject(Collections.Competitions, {
    slug: compSlug,
  });

  return {
    props: { competition: SerializeDatabaseObject(comp) },
  };
};
