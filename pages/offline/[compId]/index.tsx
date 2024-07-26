import CompetitionIndex from "@/components/competition/CompetitionIndex";
import Container from "@/components/Container";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";

export default function OfflineCompetitionPage() {
  const { savedComp, status } = useOfflineCompFromRouter();

  return (
    <Container requireAuthentication={false}>
      { savedComp 
          ? <CompetitionIndex team={savedComp.team} seasonSlug={savedComp.seasonSlug} competition={savedComp.comp} 
            fallbackData={savedComp} overrideIsManager={true} />
          : <div>Loading... Status: {status}</div>
      }
    </Container>
  )
}