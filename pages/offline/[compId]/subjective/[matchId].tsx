import Container from "@/components/Container";
import SubjectiveReportForm from "@/components/SubjectiveReportForm";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";

export default function OfflineSubjectiveReport() {
  const { savedComp, match } = useOfflineCompFromRouter();

  if (!match)
    return (
      <Container requireAuthentication={false}>
        <div>Loading...</div>
      </Container>
    );

  return (
    <Container requireAuthentication={false}>
      <SubjectiveReportForm match={match} compId={savedComp?.comp._id} />
    </Container>
  );
}