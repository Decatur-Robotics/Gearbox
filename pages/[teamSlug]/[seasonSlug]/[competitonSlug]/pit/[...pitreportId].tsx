import { getDatabase } from "@/lib/MongoDB";
import { Game, PitReportData, Pitreport } from "@/lib/Types";
import { ObjectId } from "mongodb";
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
import ClientAPI from "@/lib/client/ClientAPI";
import CollectionId from "@/lib/client/CollectionId";

const api = new ClientAPI("gearboxiscool");

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
    CollectionId.Pitreports,
    new ObjectId(id)
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.resolvedUrl.split("/pit/")[1];
  const pitreport = await getPitreport(id);

  const resolved = await UrlResolver(context, 4);
  if ("redirect" in resolved) {
    return resolved;
  }

  const game = games[resolved.season?.gameId ?? GameId.Crescendo];

  return {
    props: { 
      pitReport: SerializeDatabaseObject(pitreport),
      layout: makeObjSerializeable(game.pitReportLayout),
      teamNumber: resolved.team?.number,
      compName: resolved.competition?.name,
      game: makeObjSerializeable(game),
     },
  };
};
