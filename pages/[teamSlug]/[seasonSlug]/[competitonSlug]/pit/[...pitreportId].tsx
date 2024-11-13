import { getDatabase } from "@/lib/MongoDB";
import { Game, PitReportData, Pitreport } from "@/lib/Types";
import { ObjectId } from "bson";
import { GetServerSideProps } from "next";
import UrlResolver, { SerializeDatabaseObject } from "@/lib/UrlResolver";

import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { games } from "@/lib/games";
import { GameId } from "@/lib/client/GameId";
import { makeObjSerializeable } from "@/lib/client/ClientUtils";
import PitReportForm from "@/components/PitReport";
import { BlockElement, FormLayout, FormElement } from "@/lib/Layout";
import { Analytics } from "@/lib/client/Analytics";
import ClientApi from "@/lib/api/ClientApi";
import CollectionId from "@/lib/client/CollectionId";

const api = new ClientApi();

export default function PitreportForm(props: { pitReport: Pitreport, layout: FormLayout<PitReportData>, teamNumber: number, compName: string, game: Game }) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  return (
    <Container requireAuthentication={false} hideMenu={!hide} title={`${props.pitReport?.teamNumber ?? "Loading..."} | Pit Scouting`}>
      <PitReportForm {...props} />
    </Container>
  );
}

async function getPitreport(id: string) {
  const db = await getDatabase();
  return await db.findObjectById<Pitreport>(
    CollectionId.PitReports,
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
      pitReport: SerializeDatabaseObject(pitreport),
      layout: makeObjSerializeable(game.pitReportLayout),
      teamNumber: urlData.team?.number,
      compName: urlData.competition?.name,
      game: makeObjSerializeable(game),
     },
  };
};
