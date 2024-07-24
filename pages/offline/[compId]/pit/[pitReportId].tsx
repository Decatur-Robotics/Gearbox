import Container from "@/components/Container";
import PitReportForm from "@/components/PitReport";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";

export default function OfflinePitReport() {
  const { savedComp, pitReport } = useOfflineCompFromRouter();

  console.log("Pit Report", pitReport);
  return (
    <Container requireAuthentication={false}>
      { savedComp && pitReport
          ? <PitReportForm pitReport={pitReport} layout={savedComp.game.pitReportLayout} compId={savedComp.comp._id} />
          : <div>Loading...</div>
      }
    </Container>
  );
}