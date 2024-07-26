import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { SavedCompetition, Report, Match, Pitreport } from "../Types";
import { getCompFromLocalStorage } from "./offlineUtils";
import useDynamicState from "./useDynamicState";

export enum OfflineLoadStatus {
  Loaded = "Loaded",
  WaitingForUseEffect = "Waiting for useEffect",
  WaitingForQuery = "Waiting for query",
  NoCompInQuery = "No comp in query",
}

export default function useOfflineCompFromRouter() {
  const router = useRouter();

  const [savedComp, setSavedComp] = useState<SavedCompetition | undefined>(undefined);
  const [quantReport, setQuantReport] = useState<Report | undefined>(undefined);
  const [match, setMatch] = useState<Match | undefined>(undefined);
  const [pitReport, setPitReport] = useState<Pitreport | undefined>(undefined);

  const [status, setStatus, getStatus] = useDynamicState<OfflineLoadStatus>(OfflineLoadStatus.WaitingForUseEffect);

  function loadQuery() {
    getStatus((status) => {
      if (status === OfflineLoadStatus.Loaded)
        return;

      const { compId, quantReportId, matchId, pitReportId } = router.query;
      console.log("Loading offline comp from router", router.query);
      
      const comp = getCompFromLocalStorage(compId as string);
      if (!comp) {
        setStatus(OfflineLoadStatus.NoCompInQuery);
        setTimeout(loadQuery, 1000);
        return;
      }
      
      setStatus(OfflineLoadStatus.Loaded);
      setSavedComp(comp)

      if (quantReportId)
        setQuantReport(comp.quantReports[quantReportId as string]);

      if (matchId)
        setMatch(comp.matches[matchId as string]);

      if (pitReportId)
        setPitReport(comp.pitReports[pitReportId as string]);
    });
  }

  useEffect(() => {
    if (!router.isReady) {
      console.log("Trying to load offline comp from router, but router is not ready");

      setStatus(OfflineLoadStatus.WaitingForUseEffect);
      setTimeout(loadQuery, 1000);
      return;
    }

    loadQuery();
  }, [router.isReady]);

  return { savedComp, quantReport, match, pitReport, status };
}