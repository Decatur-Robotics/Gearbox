import { Collections, getDatabase } from "@/lib/MongoDB";
import { PitReportData, Pitreport } from "@/lib/Types";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import UrlResolver, { SerializeDatabaseObject } from "@/lib/UrlResolver";

import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { games } from "@/lib/games";
import { GameId } from "@/lib/client/GameId";
import { makeObjSerializeable } from "@/lib/client/ClientUtils";
import { FormLayout } from "@/lib/Layout";
import PitReportForm from "@/components/PitReport";

export default function PitreportForm(props: { pitreport: Pitreport, layout: FormLayout<PitReportData> }) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      <PitReportForm pitReport={props.pitreport} layout={props.layout} />
    </Container>
  );
}

async function getPitreport(id: string) {
  const db = await getDatabase();
  return await db.findObjectById<Pitreport>(
    Collections.Pitreports,
    new ObjectId(id)
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.resolvedUrl.split("/pit/")[1];
  const pitreport = await getPitreport(id);

  const urlData = await UrlResolver(context);
  const game = games[urlData.season?.gameId ?? GameId.Crescendo];

  return {
    props: { 
      pitreport: SerializeDatabaseObject(pitreport),
      layout: makeObjSerializeable(game.pitReportLayout)
     },
  };
};
