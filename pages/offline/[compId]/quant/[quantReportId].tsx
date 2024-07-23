import Container from "@/components/Container";
import Form from "@/components/forms/Form";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";

export default function OfflineQuantReport() {
  const { savedComp, quantReport } = useOfflineCompFromRouter();
  if (!savedComp) {
    return (
      <Container requireAuthentication={false}>
        <h1>Comp Not Found</h1>
      </Container>
    );
  }

  return (
    <Container requireAuthentication={false}>
      { quantReport
          ? <Form report={quantReport} layout={savedComp.game.quantitativeReportLayout} fieldImagePrefix={savedComp.game.fieldImagePrefix} 
              compId={savedComp.comp._id}/>
          : <p className="text-error">Welp.</p>
      }
    </Container>
  );
}