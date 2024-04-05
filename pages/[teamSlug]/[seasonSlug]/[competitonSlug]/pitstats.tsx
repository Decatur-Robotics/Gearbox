import Container from "@/components/Container";
import BarGraph from "@/components/stats/Graph";
import {
  Competition,
  IntakeTypes,
  Pitreport,
  Report,
  SwerveLevel,
} from "@/lib/Types";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";

import { GetServerSideProps } from "next";
import { BsGearFill } from "react-icons/bs";

import ClientAPI from "@/lib/client/ClientAPI";
import { useEffect, useRef, useState } from "react";
import { Collections, GetDatabase } from "@/lib/MongoDB";
import { NumericalAverage, StandardDeviation } from "@/lib/client/StatsMath";

import { TheBlueAlliance } from "@/lib/TheBlueAlliance";

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

type DataGroup = {
  teleop: number;
  auto: number;
  amp: number;
  speaker: number;
};

function TeamSlide(props: {
  teamNumber: number;
  teamStatPairs: TeamStatPair;
  avgTeleop: string[];
  avgAuto: string[];
  avgSpeaker: string[];
  avgAmp: string[];
  pitReport: Pitreport;
  matchReports: Report[];
  ranking: TheBlueAlliance.SimpleRank | undefined;
  maxRanking: number;
  compAverages: DataGroup;
  compStDevs: DataGroup;
}) {
  const [visible, setVisible] = useState(false);
  const stats = props.teamStatPairs[props.teamNumber];
  const length = props.avgTeleop.length;
  const pit = props.pitReport;
  const compStats = {
    avgs: props.compAverages,
    stDevs: props.compStDevs,
  };

  useEffect(() => {
    setVisible(true);
    return () => {
      setVisible(false);
    };
  }, []);

  const diffFromAvg: DataGroup = {
    teleop: stats.avgTeleop - compStats.avgs.teleop,
    auto: stats.avgAuto - compStats.avgs.auto,
    amp: stats.avgAmp - compStats.avgs.amp,
    speaker: stats.avgSpeaker - compStats.avgs.speaker,
  };
  const diffFromAvgStDev: DataGroup = {
    teleop: diffFromAvg.teleop / compStats.stDevs.teleop,
    auto: diffFromAvg.auto / compStats.stDevs.auto,
    amp: diffFromAvg.amp / compStats.stDevs.amp,
    speaker: diffFromAvg.speaker / compStats.stDevs.speaker,
  };

  function statsList(selector: (d: DataGroup) => number) {
    return (
      <ul className="ml-4 text-sm">
        <li>
          {Math.abs(selector(diffFromAvg)).toFixed(2)}{" "}
          {selector(diffFromAvg) >= 0 ? "above" : "below"} comp average of{" "}
          {selector(compStats.avgs).toFixed(2)}
        </li>
        <li>
          {Math.abs(selector(diffFromAvgStDev)).toFixed(2)} standard deviations{" "}
          {selector(diffFromAvgStDev) >= 0 ? "above" : "below"} average (StDev ={" "}
          {selector(compStats.stDevs).toFixed(2)})
        </li>
      </ul>
    );
  }

  return (
    <div
      key={props.teamNumber}
      className={`w-full h-[85%] bg-base-200 rounded-xl flex flex-row p-8 transition ease-in ${
        visible ? "translate-x-0" : "translate-x-96"
      }`}
    >
      <div className="w-1/2">
        <h1 className="font-bold text-5xl text-accent">
          Team {props.teamNumber} (#{props.ranking?.rank ?? "?"}/
          {props.maxRanking})
        </h1>
        <h2 className="font-mono">
          Scouting + Pit-scouting data
          <br />
          Record: {props.ranking?.record.wins}-{props.ranking?.record.losses}-
          {props.ranking?.record.ties}
        </h2>
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
        <div className="mt-4 text-lg">
          <p>
            Average Teleop Points: {stats.avgTeleop}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgTeleop.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
          {statsList((d) => d.teleop)}
          <p>
            Average Auto Points: {stats.avgAuto}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgAuto.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
          {statsList((d) => d.auto)}
          <p>
            Average Speaker Points: {stats.avgSpeaker}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgSpeaker.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
          {statsList((d) => d.speaker)}
          <p>
            Average Amp Points: {stats.avgAmp}{" "}
            <span className="text-primary text-lg">
              (Ranked #{props.avgAmp.indexOf(String(props.teamNumber)) + 1}/
              {length})
            </span>
          </p>
          {statsList((d) => d.amp)}
          <div>
            <h1 className="mt-4 text-lg font-semibold">Robot Capabilities:</h1>
            <p className="text-lg">
              Intake Type:{" "}
              <span className="text-accent">
                {pit.intakeType}{" "}
                {pit.intakeType !== IntakeTypes.None &&
                  `(${pit.underBumperIntake ? "Under" : "Over"} Bumper)`}
              </span>
            </p>
            <p className="text-lg">
              Drivetrain:{" "}
              <span className="text-accent">
                {pit.drivetrain} (
                {pit.swerveLevel !== SwerveLevel.None && `${pit.swerveLevel} `}
                {pit.motorType})
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="w-1/2 flex flex-col items-center">
        {pit.submitted ? (
          <img src={pit.image} className="rounded-xl w-1/3 h-auto"></img>
        ) : (
          <></>
        )}
        <BarGraph
          label="Notes Scored in Both Amp & Speaker"
          data={props.matchReports.map(
            (rep) => rep.data.TeleopScoredSpeaker + rep.data.TeleopScoredAmp
          )}
          xlabels={props.matchReports.map((r, i) => String(i + 1))}
        />
      </div>
    </div>
  );
}

export default function Pitstats(props: { competition: Competition }) {
  const comp = props.competition;
  const [reports, setReports] = useState<Report[]>([]);
  const [pitReports, setPitReports] = useState<PitReportPair>({});
  const [teamReportPairs, setTeamReportPairs] = useState<TeamReportPair>({});
  const [teamStatPairs, setTeamStatPairs] = useState<
    TeamStatPair | undefined
  >();

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

    const rankings = await api.compRankings(comp.tbaId);

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
          NumericalAverage("AutoScoredAmp", teamReports),
        avgAmp:
          NumericalAverage("TeleopScoredAmp", teamReports) +
          NumericalAverage("AutoScoredAmp", teamReports),
        avgSpeaker:
          NumericalAverage("TeleopScoredSpeaker", teamReports) +
          NumericalAverage("AutoScoredSpeaker", teamReports),
      };
    });

    const avgTeleop =
      Object.keys(newStatPairs).sort((a, b) => {
        const as = newStatPairs[Number(a)];
        const bs = newStatPairs[Number(b)];

        if (as?.avgTeleop < bs?.avgTeleop) {
          return 1;
        } else if (as?.avgTeleop > bs?.avgTeleop) {
          return -1;
        }

        return 0;
      });
    setAvgTeleop(avgTeleop);

    const avgAuto = 
    Object.keys(newStatPairs).sort((a, b) => {
      const as = newStatPairs[Number(a)];
      const bs = newStatPairs[Number(b)];

      if (as?.avgAuto < bs?.avgAuto) {
        return 1;
      } else if (as?.avgAuto > bs?.avgAuto) {
        return -1;
      }

      return 0;
    });
    setAvgAuto(avgAuto);

    const avgSpeaker = Object.keys(newStatPairs).sort((a, b) => {
      const as = newStatPairs[Number(a)];
      const bs = newStatPairs[Number(b)];

      if (as?.avgSpeaker < bs?.avgSpeaker) {
        return 1;
      } else if (as?.avgSpeaker > bs?.avgSpeaker) {
        return -1;
      }

      return 0;
    });
    setAvgSpeaker(avgSpeaker);

    const avgAmp = Object.keys(newStatPairs).sort((a, b) => {
      const as = newStatPairs[Number(a)];
      const bs = newStatPairs[Number(b)];

      if (as?.avgAmp < bs?.avgAmp) {
        return 1;
      } else if (as?.avgAmp > bs?.avgAmp) {
        return -1;
      }

      return 0;
    });
    setAvgAmp(avgAmp);

    var newPits: PitReportPair = {};
    for (var rid of comp?.pitReports) {
      const c = await api.findPitreportById(rid);
      newPits[c.teamNumber] = c;
    }

    const compAverages: DataGroup = {
      teleop:
        NumericalAverage("TeleopScoredSpeaker", newReports) +
        NumericalAverage("TeleopScoredAmp", newReports),
      auto:
        NumericalAverage("AutoScoredSpeaker", newReports) +
        NumericalAverage("AutoScoredAmp", newReports),
      amp:
        NumericalAverage("TeleopScoredAmp", newReports) +
        NumericalAverage("AutoScoredAmp", newReports),
      speaker:
        NumericalAverage("TeleopScoredSpeaker", newReports) +
        NumericalAverage("AutoScoredSpeaker", newReports),
    };

    const teleopPoints = newReports.map(
      (r) => r.data.TeleopScoredSpeaker + r.data.TeleopScoredAmp
    );
    const autoPoints = newReports.map(
      (r) => r.data.AutoScoredSpeaker + r.data.AutoScoredAmp
    );
    const ampPoints = newReports.map(
      (r) => r.data.TeleopScoredAmp + r.data.AutoScoredAmp
    );
    const speakerPoints = newReports.map(
      (r) => r.data.TeleopScoredSpeaker + r.data.AutoScoredSpeaker
    );

    const compStDevs: DataGroup = {
      teleop: StandardDeviation(teleopPoints),
      auto: StandardDeviation(autoPoints),
      amp: StandardDeviation(ampPoints),
      speaker: StandardDeviation(speakerPoints),
    };

    var newSlides = Object.keys(newStatPairs).map((key) => {
      return (
        <TeamSlide
          key={key}
          teamNumber={Number(key)}
          teamStatPairs={newStatPairs}
          avgTeleop={avgTeleop}
          avgAmp={avgAmp}
          avgAuto={avgAuto}
          avgSpeaker={avgSpeaker}
          pitReport={newPits[Number(key)]}
          matchReports={newReports.filter((r) => r.robotNumber === Number(key))}
          ranking={rankings.find((r) => r.team_key === `frc${key}`)}
          maxRanking={rankings.length}
          compAverages={compAverages}
          compStDevs={compStDevs}
        ></TeamSlide>
      );
    });
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
    <Container hideMenu={true} requireAuthentication={true} notForMobile={true}>
      <div className="w-full h-full flex flex-col items-center bg-base-300">
        <h1 className="text-4xl font-bold text-center mt-2 ">
          <BsGearFill className="inline animate-spin-slow"></BsGearFill> Gearbox
          Pit-Stats
        </h1>
        <p className="font-mono font-semibold">
          Showing <span className="text-accent">live data</span>
          <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse inline-block mx-2 translate-y-1"></div>
          from our <span className="text-accent">26 active scouters</span>
        </p>

        <progress
          className="progress progress-primary h-4 w-2/3 mt-2"
          value={(currentSlide / slides.length) * 100}
          max="100"
        ></progress>

        {!teamStatPairs ? (
          <h1>Loading...</h1>
        ) : Object.keys(teamStatPairs).length === 0 ? (
          <h1>No data.</h1>
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
