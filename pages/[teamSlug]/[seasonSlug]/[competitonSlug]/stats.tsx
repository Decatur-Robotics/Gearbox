import Container from "@/components/Container";
import { GetServerSideProps } from "next";
import UrlResolver, { SerializeDatabaseObject, SerializeDatabaseObjects } from "@/lib/UrlResolver";

import { getDatabase } from "@/lib/MongoDB";
import CollectionId from "@/lib/client/CollectionId";
import { useEffect, useRef, useState } from "react";
import { Competition, DbPicklist, Pitreport, Report, SubjectiveReport } from "@/lib/Types";
import TeamPage from "@/components/stats/TeamPage";
import PicklistScreen from "@/components/stats/Picklist";
import { FaSync } from "react-icons/fa";
import { TimeString } from "@/lib/client/FormatTime";

import ClientApi from "@/lib/api/ClientApi";
import { team } from "slack";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { defaultGameId } from "@/lib/client/GameId";
import StatsPage, { StatsPageProps } from "@/components/stats/StatsPage";
import { ObjectId } from "bson";

export default function Stats(props: StatsPageProps) {
  return <StatsPage {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await getDatabase();
  const resolved = await UrlResolver(context, 3);
  if ("redirect" in resolved) {
    return resolved;
  }

  const reports = await db.findObjects<Report>(CollectionId.Reports, {
    match: { $in: resolved.competition?.matches },
    submitted: true,
  });
  
  const pitReports = await db.findObjects<Pitreport>(CollectionId.PitReports, {
    _id: { $in: resolved.competition?.pitReports },
  });

  const subjectiveReports = await db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
    match: { $in: resolved.competition?.matches },
  });

  const picklists = await db.findObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(resolved.competition?.picklist));
  console.log("Found picklists:", resolved.competition?.picklist, picklists);

  return {
    props: {
      reports: SerializeDatabaseObjects(reports),
      pitReports: SerializeDatabaseObjects(pitReports),
      subjectiveReports: SerializeDatabaseObjects(subjectiveReports),
      picklists: SerializeDatabaseObject(picklists),
      competition: resolved.competition,
    },
  };
};
