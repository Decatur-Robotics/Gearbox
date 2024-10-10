import Container from "@/components/Container";
import PitReportForm from "@/components/PitReport";
import { games } from "@/lib/games";
import useOfflineCompFromRouter from "@/lib/client/hooks/useOfflineCompFromRouter";

export default function OfflinePitReport() {
  const { savedComp, pitReport } = useOfflineCompFromRouter();

  return (
    <Container requireAuthentication={false} title={`${pitReport?.teamNumber} | Pit Scouting`}>
      { savedComp && pitReport
          ? <PitReportForm pitReport={pitReport} layout={savedComp.game.pitReportLayout} compId={savedComp.comp._id} 
              usersTeamNumber={savedComp.team.number} compName={savedComp.comp.name} game={games[savedComp.comp.gameId]} />
          : <div>Loading...</div>
      }
    </Container>
  );
}