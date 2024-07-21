import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { SavedCompetition, Report, Match } from "../Types";
import { getCompFromLocalStorage } from "./offlineUtils";

export default function useOfflineCompFromRouter() {
  const router = useRouter();
  const { compId, quantReportId, matchId } = router.query;

  const [savedComp, setSavedComp] = useState<SavedCompetition | undefined>(undefined);
  const [quantReport, setQuantReport] = useState<Report | undefined>(undefined);
  const [match, setMatch] = useState<Match | undefined>(undefined);

  useEffect(() => {
    if (compId) {
      const comp = getCompFromLocalStorage(compId as string);
      if (!comp)
        return;
      
      setSavedComp(comp)

      if (quantReportId)
        setQuantReport(comp.quantReports[quantReportId as string]);

      if (matchId)
        setMatch(comp.matches[matchId as string]);
    }
  }, [compId, quantReportId, matchId]);

  return { savedComp, quantReport, match };
}