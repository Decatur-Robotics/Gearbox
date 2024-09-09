import { GetServerSideProps } from "next";
import UrlResolver, { SerializeDatabaseObject, SerializeDatabaseObjects } from "@/lib/UrlResolver";

import { getDatabase } from "@/lib/MongoDB";
import { DbPicklist, Pitreport, Report, SubjectiveReport } from "@/lib/Types";
import StatsPage, { StatsPageProps } from "@/components/StatsPage";
import { ObjectId } from "mongodb";
import Collections from "@/lib/client/CollectionId";

export default function Stats(props: StatsPageProps) {
  return <StatsPage {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await getDatabase();
  const url = await UrlResolver(context);
  const reports = await db.findObjects<Report>(Collections.Reports, {
    match: { $in: url.competition?.matches },
    submitted: true,
  });
  
  const pitReports = await db.findObjects<Pitreport>(Collections.Pitreports, {
    _id: { $in: url.competition?.pitReports },
  });

  const subjectiveReports = await db.findObjects<SubjectiveReport>(Collections.SubjectiveReports, {
    match: { $in: url.competition?.matches },
  });

  const picklists = await db.findObjectById<DbPicklist>(Collections.Picklists, new ObjectId(url.competition?.picklist));
  console.log("Found picklists:", url.competition?.picklist, picklists);

  return {
    props: {
      reports: SerializeDatabaseObjects(reports),
      pitReports: SerializeDatabaseObjects(pitReports),
      subjectiveReports: SerializeDatabaseObjects(subjectiveReports),
      picklists: SerializeDatabaseObject(picklists),
      competition: url.competition,
    },
  };
};
