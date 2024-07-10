import CompetitionIndex from "@/components/CompetitionIndex";
import Container from "@/components/Container";
import { Competition, Season, Team } from "@/lib/Types";

export default function CompetitionPage() {
  const team: Team = new Team("offline", undefined, undefined, 0);
  const season: Season = new Season("offline", undefined, new Date().getFullYear());
  const comp: Competition = new Competition("offline", undefined, undefined, 0, 0);

  return (
    <Container requireAuthentication={false}>
      <CompetitionIndex team={team} season={season} competition={comp} report={undefined} />
    </Container>
  )
}