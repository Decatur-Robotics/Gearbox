import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Form, { FormProps } from "@/components/forms/Form";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";
import { QuantData, Report } from "@/lib/Types";
import { FormLayout } from "@/lib/Layout";
import { makeObjSerializeable } from "@/lib/client/ClientUtils";
import { useEffect } from "react";
import ClientAPI from "@/lib/client/ClientAPI";

const api = new ClientAPI("gearboxiscool");

export default function Homepage(props: FormProps) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  useEffect(() => {
    if (props.report)
      setInterval(() => api.checkInForReport(props.report._id), 5000);
  }, []);

  return (
    <Container requireAuthentication={false} hideMenu={!hide} title={`${props.report.robotNumber} | Quant Scouting`}>
      {props.report ? (
        <Form {...props} />
      ) : (
        <p className="text-error">Welp.</p>
      )}
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const resolver = await UrlResolver(context);
  const season = resolver.season;

  // Logs
  console.log(season?.gameId);
  console.log(games);
  console.log(games[season?.gameId ?? defaultGameId]);
  console.log(games[season?.gameId ?? defaultGameId].quantitativeReportLayout);

  return {
    props: {
      report: resolver.report,
      layout: makeObjSerializeable(games[season?.gameId ?? defaultGameId].quantitativeReportLayout),
      fieldImagePrefix: games[season?.gameId ?? defaultGameId].fieldImagePrefix,
      teamNumber: resolver.team?.number,
      compName: resolver.competition?.name,
    }
  } as { props: FormProps };
};
