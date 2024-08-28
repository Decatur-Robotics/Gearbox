import Container from "@/components/Container";
import Form from "@/components/forms/Form";
import useOfflineCompFromRouter from "@/lib/client/hooks/useOfflineCompFromRouter";

export default function OfflineQuantReport() {
  const { savedComp, quantReport } = useOfflineCompFromRouter();
  if (!savedComp) {
    return (
      <Container requireAuthentication={false} title="Quant Report Loading...">
        <h1>Comp Not Found</h1>
      </Container>
    );
  }

  return (
    <Container requireAuthentication={false} title={`${quantReport?.robotNumber} | Quant Scouting`}>
      { quantReport
          ? <Form report={quantReport} layout={savedComp.game.quantitativeReportLayout} fieldImagePrefix={savedComp.game.fieldImagePrefix} 
              compId={savedComp.comp._id ?? ""} teamNumber={savedComp.team.number} compName={savedComp.comp.name}/>
          : <p className="text-error">Welp.</p>
      }
    </Container>
  );
}