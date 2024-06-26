import Container from "@/components/Container";
import { GetServerSideProps } from "next";
import UrlResolver, { SerializeDatabaseObjects } from "@/lib/UrlResolver";

import { getDatabase, Collections } from "@/lib/MongoDB";
import { useEffect, useRef, useState } from "react";
import { Competition, Pitreport, Report, SubjectiveReport } from "@/lib/Types";
import TeamPage from "@/components/stats/TeamPage";
import PicklistScreen from "@/components/stats/Picklist";
import { FaSync } from "react-icons/fa";
import { TimeString } from "@/lib/client/FormatTime";

import ClientAPI from "@/lib/client/ClientAPI";
import { team } from "slack";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";

const api = new ClientAPI("gearboxiscool");

type StatsPageProps = {
  reports: Report[];
  // pitreports: Pitreport[];
  competition: Competition;
  time: number;
};

export default function Stats(props: StatsPageProps) {
  const [update, setUpdate] = useState(props.time);
  const [updating, setUpdating] = useState(false);
  const [reports, setReports] = useState(props.reports);
  const [pitReports, setPitReports] = useState<Pitreport[]>([]);
  const [subjectiveReports, setSubjectiveReports] = useState<SubjectiveReport[]>([]);
  const [page, setPage] = useState(0);
  const [usePublicData, setUsePublicData] = useState(true);

  useEffect(() => {
    const i = setInterval(() => {
      resync();
    }, 15000);
    return () => {
      clearInterval(i);
    };
  });

  const resync = async () => {
    console.log("Resyncing...");
    setUpdating(true);

    const promises = [
      api
        .competitionReports(props.competition._id, true, usePublicData)
        .then((data) => setReports(data)),
      pitReports.length === 0 &&
        api.getPitReports(props.competition.pitReports).then((data) => {
            setPitReports(data);
          }),
      api.getSubjectiveReportsForComp(props.competition._id!).then(setSubjectiveReports),
    ].flat();

    await Promise.all(promises);

    setUpdate(Date.now());
    setUpdating(false);
  };

  useEffect(() => {
    resync();
  }, [usePublicData]);

  const teams: Set<number> = new Set();
  reports.forEach((r) => teams.add(r.robotNumber));
  pitReports.forEach((r) => teams.add(r.teamNumber));
  subjectiveReports.forEach((r) => Object.keys(r.robotComments).forEach((c) => teams.add(+c))); //+str converts to number

  return (
    <Container
      requireAuthentication={false}
      hideMenu={true}
      notForMobile={true}
    >
      <div className="flex flex-row items-center p-1 pl-2 space-x-2 bg-base-200">
          {props.competition?.tbaId !== NotLinkedToTba &&
            <button className="btn btn-ghost w-full" onClick={() => setUsePublicData(!usePublicData)}>
              { usePublicData
                ? <div className="text-secondary">Using public data</div>
                : <div>Not using public data</div> }
              <div className=" animate-pulse">(Click to toggle)</div>
            </button>
          }
        {/* <h1 className="text-xl">
          Use public data?
        </h1>
        <input className="toggle toggle-primary" type="checkbox" defaultChecked={usePublicData} onChange={(e) => setUsePublicData(e.target.checked)} /> */}
      </div>
      <div role="tablist" className="tabs tabs-boxed">
        <a
          role="tab"
          className={`tab tab-md ${page === 0 ? "tab-active" : ""}`}
          onClick={() => {
            setPage(0);
          }}
        >
          Teams
        </a>
        <a
          role="tab"
          className={`tab tab-md ${page === 1 ? "tab-active" : ""}`}
          onClick={() => {
            setPage(1);
          }}
        >
          Picklist (Beta)
        </a>
        <a
          role="tab"
          className={`tab tab-disabled tab-md ${
            page === 2 ? "tab-active" : ""
          }`}
          onClick={() => {
            // setPage(2);
          }}
        >
          Prediction (Coming Soon!)
        </a>
        {/* <a role="tab" className={`tab tab-md `} onClick={resync}>
          Resync {" "}
          <span className={`ml-2 ${updating ? "animate-spin" : ""}`}>
            <FaSync></FaSync>
          </span>{" "}
          <span className="italic text-sm ml-2">
            (Last Updated: {TimeString(update)})
          </span>
        </a> */}
      </div>

      {page === 0 ? (
        <TeamPage reports={reports} pitReports={pitReports} subjectiveReports={subjectiveReports} gameId={props.competition.gameId} />
      ) : (
        <></>
      )}
      {page === 1 ? <PicklistScreen 
        teams={Array.from(teams)} reports={reports} expectedTeamCount={props.competition.pitReports.length} picklistId={props.competition.picklist}></PicklistScreen> : <></>}
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await getDatabase();
  const url = await UrlResolver(context);
  const reports = await db.findObjects<Report>(Collections.Reports, {
    match: { $in: url.competition?.matches },
    submitted: true,
  });
  // const pitreports = await db.findObjects<Pitreport>(Collections.Pitreports, {
  //   _id: { $in: url.competition?.pitReports },
  // });
  return {
    props: {
      reports: SerializeDatabaseObjects(reports),
      competition: url.competition,
      time: Date.now(),
      // pitreports: [],
    },
  };
};
