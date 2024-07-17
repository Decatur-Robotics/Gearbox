import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import CompetitionIndex from "@/components/competition/CompetitionIndex";
import Container from "@/components/Container";

export default function CompetitionPage(props: ResolvedUrlData) {
  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <CompetitionIndex team={props.team} competition={props.competition} seasonSlug={props.season?._id} />
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  var ctx = await UrlResolver(context);
  return {
    props: ctx,
  };
};
