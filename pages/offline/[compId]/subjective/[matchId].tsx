import Container from "@/components/Container";
import SubjectiveReportForm from "@/components/SubjectiveReportForm";
import useOfflineCompFromRouter from "@/lib/client/hooks/useOfflineCompFromRouter";

export default function OfflineSubjectiveReport() {
  const { savedComp, match } = useOfflineCompFromRouter();

  if (!match)
    return (
      <Container requireAuthentication={false} title="Subjective Scouting">
        <div>Loading...</div>
      </Container>
    );

  return (
    <Container requireAuthentication={false} title={`${match?.number} | Subjective Scouting`}>
      <SubjectiveReportForm match={match} compId={savedComp?.comp._id} teamNumber={savedComp?.team.number} compName={savedComp?.comp.name} />
    </Container>
  );
}