import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { SavedCompetition, Report, Match, Pitreport } from "../Types";
import { getCompFromLocalStorage } from "./offlineUtils";

export default function useOfflineCompFromRouter() {
  const router = useRouter();
  const { compId, quantReportId, matchId, teamNumber } = router.query;

  const [savedComp, setSavedComp] = useState<SavedCompetition | undefined>(undefined);
  const [quantReport, setQuantReport] = useState<Report | undefined>(undefined);
  const [match, setMatch] = useState<Match | undefined>(undefined);
  const [pitReport, setPitReport] = useState<Pitreport | undefined>(undefined);

  useEffect(() => {
    if (compId && !savedComp) {
      console.log("Loading offline comp from router", router.query);
      
      const comp = getCompFromLocalStorage(compId as string);
      if (!comp)
        return;
      
      setSavedComp(comp)

      if (quantReportId)
        setQuantReport(comp.quantReports[quantReportId as string]);

      if (matchId)
        setMatch(comp.matches[matchId as string]);

      if (teamNumber)
        setPitReport(comp.pitReports[+teamNumber]);
    }
  });

  return { savedComp, quantReport, match, pitReport };
}