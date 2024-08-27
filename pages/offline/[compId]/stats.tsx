import StatsPage from "@/components/StatsPage";
import useOfflineCompFromRouter from "@/lib/client/useOfflineCompFromRouter";
import { ObjectId } from "bson";

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
      // I don't like generating placeholder IDs, but I haven't thought of a better method yet
      picklists={savedComp.picklists ?? { _id: new ObjectId(), picklists: {}, ownerTeam: new ObjectId(), ownerComp: new ObjectId() }}
    />
  );
}