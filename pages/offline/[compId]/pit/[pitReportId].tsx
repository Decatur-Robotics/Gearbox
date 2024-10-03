import Container from "@/components/Container";
import PitReportForm from "@/components/PitReport";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";
import { games } from "@/lib/games";

export default function OfflinePitReport() {
  const { savedComp, pitReport } = useOfflineCompFromRouter();

  return (
    <Container requireAuthentication={false} title={`${pitReport?.teamNumber} | Pit Scouting`}>
      { savedComp && pitReport
          ? <PitReportForm pitReport={pitReport} layout={savedComp.game.pitReportLayout} compId={savedComp.comp._id} 
              usersteamNumber={savedComp.team.number} compName={savedComp.comp.name} game={games[savedComp.comp.gameId]} />
          : <div>Loading...</div>
      }
    </Container>
  );
}