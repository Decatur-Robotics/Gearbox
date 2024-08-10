import StatsPage from "@/components/StatsPage";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";

export default function OfflineStats() {
  const { savedComp, status } = useOfflineCompFromRouter();

  if (!savedComp)
    return <div>Loading... Status: {status}</div>

  return (
    <StatsPage 
      competition={savedComp?.comp}
      reports={Object.values(savedComp.quantReports).filter((r) => r.submitted)}
      pitReports={Object.values(savedComp.pitReports)}
      subjectiveReports={Object.values(savedComp.subjectiveReports)}
      picklists={savedComp.picklists ?? { _id: "", picklists: {} }}
    />
  );
}