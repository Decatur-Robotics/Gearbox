import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { SavedCompetition, Report, Match, Pitreport } from "../Types";
import { getCompFromLocalStorage } from "./offlineUtils";

export default function useOfflineCompFromRouter() {
  const router = useRouter();

  const [savedComp, setSavedComp] = useState<SavedCompetition | undefined>(undefined);
  const [quantReport, setQuantReport] = useState<Report | undefined>(undefined);
  const [match, setMatch] = useState<Match | undefined>(undefined);
  const [pitReport, setPitReport] = useState<Pitreport | undefined>(undefined);

  useEffect(() => {
    if (!router.isReady) {
      console.log("Trying to load offline comp from router, but router is not ready");
      return;
    }

    const { compId, quantReportId, matchId, pitReportId } = router.query;
    console.log("Loading offline comp from router", router.query);
    
    const comp = getCompFromLocalStorage(compId as string);
    if (!comp)
      return;
    
    setSavedComp(comp)

    if (quantReportId)
      setQuantReport(comp.quantReports[quantReportId as string]);

    if (matchId)
      setMatch(comp.matches[matchId as string]);

    if (pitReportId)
      setPitReport(comp.pitReports[pitReportId as string]);
  }, [router.isReady]);

  return { savedComp, quantReport, match, pitReport };
}