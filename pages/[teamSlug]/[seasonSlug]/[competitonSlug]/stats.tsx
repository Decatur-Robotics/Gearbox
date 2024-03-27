import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { GetServerSideProps } from "next";
import UrlResolver, {
  ResolvedUrlData,
  SerializeDatabaseObject,
} from "@/lib/UrlResolver";

import { GetDatabase, Collections } from "@/lib/MongoDB";
import { Competition, Report } from "@/lib/Types";
import { useEffect, useState } from "react";
import TeamPage from "@/components/stats/TeamPage";
import PicklistScreen from "@/components/stats/Picklist";
import { FaSync } from "react-icons/fa";
import { TimeString } from "@/lib/client/FormatTime";

import ClientAPI from "@/lib/client/ClientAPI";
import {
  AveragePoints,
  StandardDeviation,
  TotalPoints,
} from "@/lib/client/StatsMath";
const api = new ClientAPI("gearboxiscool");

export default function Stats(props: {
  reports: Report[];
  competition: Competition;
  time: number;
}) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  const [update, setUpdate] = useState(props.time);
  const [updating, setUpdating] = useState(false);
  const [reports, setReports] = useState(props.reports);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      resync();
    }, 15000);
    return () => {
      clearInterval(i);
    };
  });

  const resync = async () => {
    setUpdating(true);
    setReports(await api.competitionReports(props.competition._id, true));
    setUpdate(Date.now());
    setUpdating(false);
  };

  return (
    <Container
      requireAuthentication={false}
      hideMenu={!hide}
      notForMobile={true}
    >
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
        <a role="tab" className={`tab tab-md `} onClick={resync}>
          Resync{" "}
          <span className={`ml-2 ${updating ? "animate-spin" : ""}`}>
            <FaSync></FaSync>
          </span>{" "}
          <span className="italic text-sm ml-2">
            (Last Updated: {TimeString(update)})
          </span>
        </a>
      </div>

      {page === 0 ? <TeamPage reports={reports}></TeamPage> : <></>}
      {page === 1 ? <PicklistScreen reports={reports}></PicklistScreen> : <></>}
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();
  const url = await UrlResolver(context);
  const dbReports = await db.findObjects<Report>(Collections.Reports, {
    match: { $in: url.competition?.matches },
    submitted: true,
  });
  const reports = dbReports.map((report) => SerializeDatabaseObject(report));
  return {
    props: { reports: reports, competition: url.competition, time: Date.now() },
  };
};
