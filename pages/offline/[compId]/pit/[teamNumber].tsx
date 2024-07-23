import Container from "@/components/Container";
import PitReportForm from "@/components/PitReport";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";

export default function OfflinePitReport() {
  const { savedComp, pitReport } = useOfflineCompFromRouter();

  return (
    <Container requireAuthentication={false}>
      { savedComp && pitReport
          ? <PitReportForm pitReport={pitReport} layout={savedComp.game.pitReportLayout} />
          : <div>Loading...</div>
      }
    </Container>
  );
}