import Container from "@/components/Container";
import PitReportForm from "@/components/PitReport";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";

export default function OfflinePitReport() {
  const { savedComp, pitReport } = useOfflineCompFromRouter();

  return (
    <Container requireAuthentication={false} title={`${pitReport?.teamNumber} | Pit Scouting`}>
      { savedComp && pitReport
          ? <PitReportForm pitReport={pitReport} layout={savedComp.game.pitReportLayout} compId={savedComp.comp._id} 
              usersTeamNumber={savedComp.team.number} compName={savedComp.comp.name} />
          : <div>Loading...</div>
      }
    </Container>
  );
}