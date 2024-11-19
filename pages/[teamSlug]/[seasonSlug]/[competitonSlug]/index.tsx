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
  const resolved = await UrlResolver(context, 3);
  if ("redirect" in resolved) {
    return resolved;
  }
  
  return {
    props: {
      competition: resolved.competition ? makeObjSerializeable(resolved.competition) : null,
      team: resolved.team ? makeObjSerializeable(resolved.team) : null,
      season: resolved.season ? makeObjSerializeable(resolved.season) : null,
    },
  };
};
