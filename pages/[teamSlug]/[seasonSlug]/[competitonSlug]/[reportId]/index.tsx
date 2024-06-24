import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Form from "@/components/forms/Form";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";
import { QuantData, Report } from "@/lib/Types";
import { FormLayout } from "@/lib/Layout";
import { makeObjSerializeable } from "@/lib/Utils";

export default function Homepage(props: { report: Report, layout: FormLayout<QuantData>, fieldImgPrefix: string }) {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      {props.report ? (
        <Form report={props.report} layout={props.layout} fieldImagePrefix={props.fieldImgPrefix} />
      ) : (
        <p className="text-error">Welp.</p>
      )}
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const resolver = await UrlResolver(context);
  const season = resolver.season;

  return {
    props: {
      report: resolver.report,
      layout: makeObjSerializeable(games[season?.gameId ?? defaultGameId].quantitativeReportLayout),
      fieldImgPrefix: games[season?.gameId ?? defaultGameId].fieldImagePrefix
    }
  };
};
