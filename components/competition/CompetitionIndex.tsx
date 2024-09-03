import { ChangeEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import {
  AllianceColor,
  Match,
  MatchType,
  Pitreport,
  Report,
  SavedCompetition,
  SubjectiveReport,
  User,
  Team,
  Competition,
  League,
  DbPicklist
} from "@/lib/Types";

import Link from "next/link";
import { useCurrentSession } from "@/lib/client/hooks/useCurrentSession";

import {
  MdAutoGraph,
  MdCoPresent,
  MdErrorOutline,
  MdQueryStats,
} from "react-icons/md";
import { BsClipboard2Check, BsGearFill, BsQrCode, BsQrCodeScan } from "react-icons/bs";
import { FaBinoculars, FaDatabase, FaSync, FaUserCheck } from "react-icons/fa";
import { FaCheck, FaRobot, FaUserGroup } from "react-icons/fa6";
import { Round } from "@/lib/client/StatsMath";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import useInterval from "@/lib/client/hooks/useInterval";
import { NotLinkedToTba, download, getIdsInProgressFromTimestamps } from "@/lib/client/ClientUtils";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";
import { saveCompToLocalStorage, updateCompInLocalStorage } from "@/lib/client/offlineUtils";
import { toDict } from "@/lib/client/ClientUtils";
import { BiExport } from "react-icons/bi";
import DownloadModal from "./DownloadModal";
import EditMatchModal from "./EditMatchModal";
import useIsOnline from "@/lib/client/useIsOnline";
import CompHeaderCard from "./CompHeaderCard";
import InsightsAndSettingsCard from "./InsightsAndSettingsCard";
import MatchScheduleCard from "./MatchScheduleCard";
import PitScoutingCard from "./PitScoutingCard";
import { BSON, ObjectId } from "bson";

const api = new ClientAPI("gearboxiscool");

export default function CompetitionIndex(props: {
  team: Team | undefined,
  competition: Competition | undefined,
  seasonSlug: string | undefined,
  fallbackData?: SavedCompetition
  overrideIsManager?: boolean
}) {
  const team = props.team;
  const seasonSlug = props.seasonSlug;
  const comp = props.competition;
  const fallbackData = props.fallbackData
    ? {
        users: props.fallbackData.users,
        matches: Object.values(props.fallbackData.matches),
        quantReports: Object.values(props.fallbackData.quantReports),
        subjectiveReports: Object.values(props.fallbackData.subjectiveReports),
        pitReports: Object.values(props.fallbackData.pitReports),
    }
    : undefined;

  const { session, status } = useCurrentSession();
  const isManager = session?.user?._id
    ? team?.owners.includes(session.user?._id) || props.overrideIsManager
    : false || props.overrideIsManager;

  const [showSettings, setShowSettings] = useState(false);
  const [matchNumber, setMatchNumber] = useState<number | undefined>(undefined);
  const [blueAlliance, setBlueAlliance] = useState<number[]>([]);
  const [redAlliance, setRedAlliance] = useState<number[]>([]);

  const [matches, setMatches] = useState<Match[]>([]);
  const qualificationMatches = matches.filter((match) => match.type === MatchType.Qualifying);

  const [showSubmittedMatches, setShowSubmittedMatches] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [matchesAssigned, setMatchesAssigned] = useState<boolean | undefined>(undefined);
  const [assigningMatches, setAssigningMatches] = useState(false);
  const [noMatches, setNoMatches] = useState(false);

  const [subjectiveReports, setSubjectiveReports] = useState<SubjectiveReport[]>([]);

  const [reportsById, setReportsById] = useState<{ [key: string]: Report }>({});
  const [usersById, setUsersById] = useState<{ [key: string]: User }>({});
  const [subjectiveReportsById, setSubjectiveReportsById] = useState<{ [key: string]: SubjectiveReport }>({});

  //loading states
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingScoutStats, setLoadingScoutStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [submissionRate, setSubmissionRate] = useState(0);
  const [submittedReports, setSubmittedReports] = useState<number | undefined>(
    undefined
  );

  const [pitreports, setPitreports] = useState<Pitreport[]>([]);
  const [loadingPitreports, setLoadingPitreports] = useState(true);
  const [submittedPitreports, setSubmittedPitreports] = useState<
    number | undefined
  >(undefined);
  const [
    attemptedRegeneratingPitReports,
    setAttemptedRegeneratingPitReports,
  ] = useState(false);

  const [picklists, setPicklists] = useState<DbPicklist | undefined>();

  const [updatingComp, setUpdatingComp] = useState("");

  const [ranking, setRanking] = useState<{
    place: number | string;
    max: number;
  } | null>(null);

  const [matchBeingEdited, setMatchBeingEdited] = useState<ObjectId | undefined>();

  const [teamToAdd, setTeamToAdd] = useState<number>(0);

  const [newCompName, setNewCompName] = useState(comp?.name);
  const [newCompTbaId, setNewCompTbaId] = useState(comp?.tbaId);

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const isOnline = useIsOnline();

  useEffect(() => {
    if (!fallbackData) {
      console.log("No fallback data provided");

      return;
    }

    console.log("Initially loading fallback data:", fallbackData);

    if (!matches || matches.length === 0)
      setMatches(fallbackData.matches);
    if (!reports || reports.length === 0) {
      setReports(fallbackData.quantReports);
      setReportsById(toDict(fallbackData.quantReports));
    }
    if (!pitreports || pitreports.length === 0) {
      setPitreports(fallbackData.pitReports);
      setLoadingPitreports(false);
    }
    if (!subjectiveReports || subjectiveReports.length === 0)
      setSubjectiveReports(fallbackData.subjectiveReports);
    console.log(usersById);
    if (!usersById || Object.keys(usersById).length === 0) {
      console.log("Setting users by id", fallbackData.users);
      setUsersById(fallbackData.users);
      setLoadingUsers(false);
    }
    if (!picklists)
      setPicklists(props.fallbackData?.picklists);
  }, [props.fallbackData?.comp._id]);

  const regeneratePitReports = async () => {
    if (!comp?.tbaId || !comp?._id || !team?._id) {
      console.error("Invalid competition or team");
      return;
    }

    console.log("Regenerating pit reports...");
    api
      .regeneratePitReports(comp.tbaId, comp._id, team._id)
      .then(({ pitReports }: { pitReports: ObjectId[] }) => {
        setAttemptedRegeneratingPitReports(true);
        setLoadingPitreports(true);

        // Fetch pit reports
        const pitReportPromises = pitReports.map(api.findPitreportById);

        Promise.all(pitReportPromises).then((reports) => {
          console.log("Got all pit reports");
          setPitreports(reports);
          setLoadingPitreports(false);
        });
      });
  };

  useEffect(() => {
    if (!reports)
      return;

    let matchesAssigned = true;

    for (const report of reports) {
      if (!report.user) {
        matchesAssigned = false;
        break;
      }
    }

    setMatchesAssigned(matchesAssigned);
  }, [reports]);

  const loadMatches = async (silent: boolean = false) => {
    if (!comp?._id) {
      console.error("No competition ID provided");
      return;
    }

    if (!silent)
      setLoadingMatches(true);
    
    window.location.hash = "";
    let matches: Match[] = await api.allCompetitionMatches(comp._id, fallbackData?.matches) ?? fallbackData?.matches;
    if (matches.length === 0)
      matches = fallbackData?.matches ?? [];

    if (!matches || matches.length === 0) {
      setNoMatches(true);

      if (!silent)
        setLoadingMatches(false);

      return;
    }
    
    matches?.sort((a, b) => a.number - b.number);

    setMatches(matches);

    api.getSubjectiveReportsFromMatches(matches, fallbackData?.subjectiveReports).then((reports) => {
      setSubjectiveReports(reports);

      const newReportIds: { [key: string]: SubjectiveReport } = {};
      reports.forEach((report) => {
        if (!report._id) {
          return;
        }
        newReportIds[report._id.toString()] = report;
      });
      setSubjectiveReportsById(newReportIds);
    });
    
    if (!silent)
      setLoadingMatches(false);
  };

  const loadReports = async (silent: boolean = false) => {
    const scoutingStats = (reps: Report[]) => {
      if (!silent)
        setLoadingScoutStats(true);
      let submittedCount = 0;
      reps.forEach((report) => {
        if (report.submitted) {
          submittedCount++;
        }
      });

      setSubmittedReports(submittedCount);
      if (!silent)
        setLoadingScoutStats(false);
    };

    if (!silent)
      setLoadingReports(true);

    if (!comp?._id) {
      console.error("No competition ID provided");
      setLoadingReports(false);
      return;
    }

    let newReports: Report[] = await api.competitionReports(
      comp._id,
      false,
      false,
      fallbackData?.quantReports
    );

    if (!newReports || newReports.length === 0)
      newReports = fallbackData?.quantReports ?? [];

    setReports(newReports);

    const newReportsById: { [key: string]: Report } = {};
    newReports?.forEach((report) => {
      if (!report._id) {
        return;
      }
      newReportsById[report._id.toString()] = report;
    });
    setReportsById(newReportsById);

    if (!silent)
      setLoadingReports(false);

    scoutingStats(newReports);
  };

  useEffect(() => {
    setInterval(() => loadReports(true), 5000);
  }, []);

  useEffect(() => {
    const loadUsers = async (silent: boolean = false) => {
      console.log("Loading users...");

      if (Object.keys(usersById).length === 0 && !silent)
        setLoadingUsers(true);

      if (!team || (!team.scouters && !team.subjectiveScouters)) {
        return;
      }

      const newUsersById: { [key: string]: User } = {};
      const promises: Promise<any>[] = [];
      for (const userId of team.users) {
        promises.push(api.findUserById(userId, fallbackData?.users[userId.toString()])
          .then((user) => {
            if (user) {
              newUsersById[userId.toString()] = user;
            }
          })
          .catch((e) => {
            if (fallbackData?.users[userId.toString()])
              newUsersById[userId.toString()] = fallbackData.users[userId.toString()];
          })
        );
      }

      await Promise.all(promises);

      setUsersById(newUsersById);
      setLoadingUsers(false);
    };

    const loadPitreports = async (silent: boolean = false) => {
      console.log("Loading pit reports... Current:", pitreports);
      if (pitreports.length === 0 && !silent)
       setLoadingPitreports(true);
  
      if (!comp?.pitReports) {
        setLoadingPitreports(false);
        return;
      }
      const newPitReports: Pitreport[] = [];
      let submitted = 0;
      const promises: Promise<any>[] = [];
      for (const pitreportId of comp?.pitReports) {
        promises.push(api.findPitreportById(pitreportId)
          .catch((e) => fallbackData?.pitReports.find((r) => r._id === pitreportId))
          .then((pitreport) => {
            if (!pitreport) {
              return;
            }

            if (pitreport.submitted) {
              submitted++;
            }
            newPitReports.push(pitreport);
          }));
      }

      await Promise.all(promises);

      console.log("Loaded pit reports:", newPitReports);
      setSubmittedPitreports(submitted);
      setPitreports(newPitReports);
      setLoadingPitreports(false);
    };

    if (!assigningMatches) {
      loadUsers(true);
      loadMatches(matches !== undefined);
      loadReports(reports !== undefined);
      loadPitreports(true);
    }

    // Load picklists
    if (comp?._id)
      api.getPicklist(comp?._id).then(setPicklists).catch(console.error);

    // Resync pit reports if none are present
    if (!attemptedRegeneratingPitReports && comp?.pitReports.length === 0) {
      regeneratePitReports();
    }
  }, [assigningMatches]);

  const assignScouters = async () => {
    if (!comp?._id || !team?._id) {
      console.error("No competition or team ID provided");
      return;
    }

    setAssigningMatches(true);
    const res = await api.assignScouters(team._id, comp._id, true, props.fallbackData);

    if (props.fallbackData && res === props.fallbackData) {
      location.reload();
      return;
    }

    if ((res.result as string).toLowerCase() !== "success") {
      alert(res.result);
    }

    setAssigningMatches(false);
  };

  const reloadCompetition = async () => {
    if (!comp?._id || !comp?.tbaId) {
      console.error("No competition or TBA ID provided");
      return;
    }

    const num = Math.floor(Math.random() * 1000000);
    if(prompt(`Are you sure you want to reload the competition? This will overwrite ALL your data. We CANNOT recover your data. If you are sure, type '${num}'`) !== String(num)) {
      alert("Cancelled");
      return;
    }

    alert("Reloading competition...");

    setUpdatingComp("Checking for Updates...");
    const res = await api.reloadCompetition(comp._id, comp.tbaId);
    if (res.result === "success") {
      window.location.reload();
    } else {
      setUpdatingComp("None found");
    }
  };

  const createMatch = async () => {
    if (!comp?._id || !team?._id || !matchNumber || !blueAlliance || !redAlliance) {
      console.error("Invalid competition, team, or match number");
      return;
    }

    try {
      await api.createMatch(
        comp._id,
        Number(matchNumber),
        MatchType.Qualifying,
        blueAlliance as number[],
        redAlliance as number[],
        team._id,
        comp._id
      );
    } catch (e) {
      console.error(e);

      // Save match to local storage
      const savedComp = getSavedCompetition();
      if (!savedComp) return;

      const match = new Match(Number(matchNumber), "", "", Date.now(), MatchType.Qualifying, 
        blueAlliance as number[], redAlliance as number[], team?._id!, savedComp.comp?._id!);
      match._id = new BSON.ObjectId();

      savedComp.matches[match._id.toString()] = match;
      savedComp?.comp.matches.push(match._id);

      saveCompToLocalStorage(savedComp);
    }

    location.reload();
  };

  // useEffect(() => {
  //   if (
  //     qualificationMatches.length > 0 &&
  //     Object.keys(reportsById).length > 0 &&
  //     !showSubmittedMatches
  //   ) {
  //     const b = qualificationMatches.filter((match) => {
  //       let s = true;

  //       for (const id of match.reports) {
  //         const r = reportsById[id];
  //         if (!r?.submitted) {
  //           s = false;
  //           break;
  //         }
  //       }
  //       return !s;
  //     });
  //     if (b.length > 0) {
  //       setQualificationMatches(b);
  //     }
  //   }
  // }, [reportsById, matches, showSubmittedMatches]);

  function toggleShowSubmittedMatches() {
    setShowSubmittedMatches(!showSubmittedMatches);

    loadMatches(matches !== undefined);
  }

  const [exportPending, setExportPending] = useState(false);

  const exportAsCsv = async () => {
    setExportPending(true);

    const res = await api.exportCompAsCsv(comp?._id).catch((e) => {
      console.error(e);
    });

    if (res.csv) {
      download(`${comp?.name ?? "Competition"}.csv`, res.csv, "text/csv");
    } else {
      console.error("No CSV data returned from server");

      alert(
        res.error ?? "An error occurred while exporting the competition data"
      );
    }

    setExportPending(false);
  };

  useEffect(() => {
    if (ranking || !comp?.tbaId || !team?.number) return;

    api.teamCompRanking(comp?.tbaId, team?.number).then((res) => {
      setRanking(res);
    });
  });

  function openEditMatchModal(match: Match) {
    (document.getElementById("edit-match-modal") as HTMLDialogElement | undefined)?.showModal();
    
    setMatchBeingEdited(match._id);
    closeDownloadModal();
  }

  useInterval(() => loadMatches(true), 5000);

  function togglePublicData(e: ChangeEvent<HTMLInputElement>) {
    if (!comp?._id) return;
    api.setCompPublicData(comp._id, e.target.checked);
  }
    
  function remindUserOnSlack(slackId: string) {
    if (slackId && session?.user?.slackId && team?._id && isManager && confirm("Remind scouter on Slack?"))
      api.remindSlack(slackId, session?.user?.slackId, team._id);
  }

  function addTeam() {
    console.log("Adding pit report for team", teamToAdd);
    if (!teamToAdd || teamToAdd < 1 || !comp?._id) return;

    api.createPitReportForTeam(teamToAdd, comp?._id)
      // We can't just pass location.reload, it will throw "illegal invocation." I don't know why. -Renato
      .finally(() => location.reload());
  }

  async function saveCompChanges() {
    // Check if tbaId is valid
    if (!comp?.tbaId || !comp?.name || !comp?._id) return;

    let tbaId = newCompTbaId;
    const autoFillData = await api.getCompetitionAutofillData(tbaId ?? "");
    if (!autoFillData.name && !confirm(`Invalid TBA ID: ${tbaId}. Save changes anyway?`))
        return;

    await api.updateCompNameAndTbaId(comp._id, newCompName ?? "Unnamed", tbaId ?? NotLinkedToTba);
    location.reload();
  }

  const allianceIndices: number[] = [];
  for (let i = 0; i < games[comp?.gameId ?? defaultGameId].allianceSize; i++) {
    allianceIndices.push(i);
  }

  function getSavedCompetition() {
    if (!comp || !team) return;

    // Save comp to local storage
    const savedComp = new SavedCompetition(comp, games[comp?.gameId ?? defaultGameId], team, usersById, seasonSlug);
    savedComp.lastAccessTime = Date.now();

    savedComp.matches = toDict(matches);
    savedComp.quantReports = toDict(reports);
    savedComp.pitReports = toDict(pitreports);
    savedComp.subjectiveReports = toDict(subjectiveReports);

    savedComp.picklists = picklists;
    
    return savedComp;
  }

  function setSavedCompetition(comp: SavedCompetition) {
    saveCompToLocalStorage(comp);

    location.reload();
  }

  useEffect(() => {
    const comp = getSavedCompetition();
    if (comp) {
      console.log("Saving competition to local storage... Comp:", comp);
      saveCompToLocalStorage(comp);
    }
  }, [comp, matches, reports, pitreports, subjectiveReports, usersById]);

  // Offline mode
  useEffect(() => {
    const savedComp = getSavedCompetition();

    if (savedComp)
      saveCompToLocalStorage(savedComp);
  }, [comp, matches, reports, pitreports, subjectiveReports, usersById]);

  function openDownloadModal() {
    setDownloadModalOpen(true);
  }

  function closeDownloadModal() {
    setDownloadModalOpen(false);
  }

  return (
    <>
      <div className="min-h-screen w-screen flex flex-col sm:flex-row grow-0 items-start justify-center max-sm:content-center sm:space-x-6 my-2 overflow-hidden max-sm:my-4">
        <div className="w-1/2 sm:w-2/5 flex flex-col grow-0 space-y-14 h-full">
          <CompHeaderCard comp={comp} openDownloadModal={openDownloadModal} isOnline={isOnline} />
          <InsightsAndSettingsCard 
            showSettings={showSettings} setShowSettings={setShowSettings} isManager={isManager} comp={comp}
            newCompName={newCompName} setNewCompName={setNewCompName} newCompTbaId={newCompTbaId} setNewCompTbaId={setNewCompTbaId}
            saveCompChanges={saveCompChanges} togglePublicData={togglePublicData} exportAsCsv={exportAsCsv}
            exportPending={exportPending} regeneratePitReports={regeneratePitReports} reloadCompetition={reloadCompetition}
            toggleShowSubmittedMatches={toggleShowSubmittedMatches} showSubmittedMatches={showSubmittedMatches}
            pitreports={pitreports} submittedPitreports={submittedPitreports} addTeam={addTeam} teamToAdd={teamToAdd} 
            setTeamToAdd={setTeamToAdd} seasonSlug={seasonSlug} assignScouters={assignScouters} assigningMatches={assigningMatches}
            redAlliance={redAlliance} setRedAlliance={setRedAlliance} blueAlliance={blueAlliance} setBlueAlliance={setBlueAlliance}
            matchNumber={matchNumber} setMatchNumber={setMatchNumber} createMatch={createMatch} allianceIndices={allianceIndices}
            submittedReports={submittedReports} team={team} reports={reports} loadingScoutStats={loadingScoutStats}
          />
        </div>

        <div className="w-1/2 flex flex-col max-sm:items-center h-screen space-y-4">
          <MatchScheduleCard 
            matches={matches} qualificationMatches={qualificationMatches}
            usersById={usersById} reportsById={reportsById} comp={comp} isManager={isManager} openEditMatchModal={openEditMatchModal}
            loadingMatches={loadingMatches} loadingReports={loadingReports}
            loadingUsers={loadingUsers} team={team} ranking={ranking} noMatches={noMatches}
            isOnline={isOnline} matchesAssigned={matchesAssigned} assignScouters={assignScouters}
            assigningMatches={assigningMatches} remindUserOnSlack={remindUserOnSlack}
            reloadCompetition={reloadCompetition} seasonSlug={seasonSlug} updatingComp={updatingComp}
            session={session}
          />
          <PitScoutingCard pitreports={pitreports} loadingPitreports={loadingPitreports} comp={comp} />
        </div>

        { isManager && 
          <EditMatchModal 
            close={() => setMatchBeingEdited(undefined)} 
            match={matches.find(m => m._id === matchBeingEdited!)}
            reportsById={reportsById}
            usersById={usersById}
            comp={comp}
            loadReports={loadReports}
            loadMatches={loadMatches}
          /> 
        }
        { (team && comp && downloadModalOpen) &&
            <DownloadModal 
              open={downloadModalOpen} 
              close={() => setDownloadModalOpen(false)} 
              team={team} 
              comp={comp} 
              getSavedComp={getSavedCompetition}
              setSavedComp={setSavedCompetition}
            />
        }
      </div>
    </>
  );
}