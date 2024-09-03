import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import CompetitionIndex from "@/components/competition/CompetitionIndex";
import Container from "@/components/Container";
import { makeObjSerializeable } from "@/lib/client/ClientUtils";

export default function CompetitionPage(props: ResolvedUrlData) {
  return (
    <Container requireAuthentication={true} hideMenu={false} title={props.competition?.name ?? "Competition Loading"}>
      <CompetitionIndex team={props.team} competition={props.competition} seasonSlug={props.season?.slug} />
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  var ctx = await UrlResolver(context);
  return {
    props: {
      competition: ctx.competition ? makeObjSerializeable(ctx.competition) : null,
      team: ctx.team ? makeObjSerializeable(ctx.team) : null,
      season: ctx.season ? makeObjSerializeable(ctx.season) : null,
    },
  };
};
