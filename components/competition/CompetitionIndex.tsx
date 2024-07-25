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
  League
} from "@/lib/Types";

import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

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
import useInterval from "@/lib/client/useInterval";
import { NotLinkedToTba, download, getIdsInProgressFromTimestamps } from "@/lib/client/ClientUtils";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";
import { saveCompToLocalStorage, updateCompInLocalStorage } from "@/lib/client/offlineUtils";
import { toDict } from "@/lib/client/ClientUtils";
import { BiExport } from "react-icons/bi";
import DownloadModal from "./DownloadModal";
import EditMatchModal from "./EditMatchModal";
import { BSON } from "bson";
import useIsOnline from "@/lib/client/useIsOnline";

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
  const [blueAlliance, setBlueAlliance] = useState<number[] | undefined[]>([]);
  const [redAlliance, setRedAlliance] = useState<number[]>([]);

  const [matches, setMatches] = useState<Match[]>([]);
  const [qualificationMatches, setQualificationMatches] = useState<Match[]>([]);
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

  const [updatingComp, setUpdatingComp] = useState("");

  const [ranking, setRanking] = useState<{
    place: number | string;
    max: number;
  } | null>(null);

  const [matchBeingEdited, setMatchBeingEdited] = useState<string | undefined>();

  const [teamToAdd, setTeamToAdd] = useState<number | undefined>();

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

    if (!matches)
      setMatches(fallbackData.matches);
    if (!reports)
      setReports(fallbackData.quantReports);
    if (!pitreports) {
      setPitreports(fallbackData.pitReports);
      setLoadingPitreports(false);
    }
    if (!subjectiveReports)
      setSubjectiveReports(fallbackData.subjectiveReports);
    if (!usersById) {
      setUsersById(fallbackData.users);
      setLoadingUsers(false);
    }
  }, [props.fallbackData?.comp._id]);

  const regeneratePitReports = async () => {
    console.log("Regenerating pit reports...");
    api
      .regeneratePitReports(comp?.tbaId, comp?._id)
      .then(({ pitReports }: { pitReports: string[] }) => {
        setAttemptedRegeneratingPitReports(true);
        setLoadingPitreports(true);

        // Fetch pit reports
        const pitReportPromises = pitReports.map(
          api.findPitreportById
        );

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
    if (!silent)
      setLoadingMatches(true);
    
    window.location.hash = "";
    let matches: Match[] = await api.allCompetitionMatches(comp?._id, fallbackData?.matches) ?? fallbackData?.matches;
    if (matches.length === 0)
      matches = fallbackData?.matches ?? [];

    if (!matches || matches.length === 0) {
      setNoMatches(true);

      if (!silent)
        setLoadingMatches(false);

      return;
    }
    
    matches?.sort((a, b) => a.number - b.number);

    setQualificationMatches(
      matches?.filter((match) => match.type === MatchType.Qualifying)
    );

    setMatches(matches);

    api.getSubjectiveReportsFromMatches(matches, fallbackData?.subjectiveReports).then((reports) => {
      setSubjectiveReports(reports);

      const newReportIds: { [key: string]: SubjectiveReport } = {};
      reports.forEach((report) => {
        if (!report._id) {
          return;
        }
        newReportIds[report._id] = report;
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

    let newReports: Report[] = await api.competitionReports(
      comp?._id,
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
      newReportsById[report._id] = report;
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
    const loadUsers = async () => {
      console.log("Loading users...");

      if (Object.keys(usersById).length === 0)
        setLoadingUsers(true);

      if (!team || (!team.scouters && !team.subjectiveScouters)) {
        return;
      }

      const newUsersById: { [key: string]: User } = {};
      const promises: Promise<any>[] = [];
      for (const userId of team.users) {
        promises.push(api.findUserById(userId, fallbackData?.users[userId]).then((user) => {
          if (user) {
            newUsersById[userId] = user;
          }
        }));
      }

      await Promise.all(promises);

      setUsersById(newUsersById);
      setLoadingUsers(false);
    };

    const loadPitreports = async () => {
      console.log("Loading pit reports... Current:", pitreports);
      if (pitreports.length === 0)
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
      loadUsers();
      loadMatches(matches !== undefined);
      loadReports(reports !== undefined);
      loadPitreports();
    }

    // Resync pit reports if none are present
    if (!attemptedRegeneratingPitReports && comp?.pitReports.length === 0) {
      regeneratePitReports();
    }
  }, [assigningMatches]);

  const assignScouters = async () => {
    setAssigningMatches(true);
    const res = await api.assignScouters(team?._id, comp?._id, true, props.fallbackData);

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
    const num = Math.floor(Math.random() * 1000000);
    if(prompt(`Are you sure you want to reload the competition? This will overwrite ALL your data. We CANNOT recover your data. If you are sure, type '${num}'`) !== String(num)) {
      alert("Cancelled");
      return;
    }

    alert("Reloading competition...");

    setUpdatingComp("Checking for Updates...");
    const res = await api.reloadCompetition(comp?._id, comp?.tbaId);
    if (res.result === "success") {
      window.location.reload();
    } else {
      setUpdatingComp("None found");
    }
  };

  const createMatch = async () => {
    try {
      await api.createMatch(
        comp?._id,
        Number(matchNumber),
        MatchType.Qualifying,
        blueAlliance as number[],
        redAlliance as number[]
      );
    } catch (e) {
      console.error(e);

      // Save match to local storage
      const savedComp = getSavedCompetition();
      if (!savedComp) return;

      const match = new Match(Number(matchNumber), "", "", Date.now(), MatchType.Qualifying, 
        blueAlliance as number[], redAlliance as number[]);
      match._id = new BSON.ObjectId().toHexString();

      savedComp.matches[match._id] = match;
      savedComp?.comp.matches.push(match._id);

      saveCompToLocalStorage(savedComp);
    }

    location.reload();
  };

  useEffect(() => {
    if (
      qualificationMatches.length > 0 &&
      Object.keys(reportsById).length > 0 &&
      !showSubmittedMatches
    ) {
      const b = qualificationMatches.filter((match) => {
        let s = true;

        for (const id of match.reports) {
          const r = reportsById[id];
          if (!r?.submitted) {
            s = false;
            break;
          }
        }
        return !s;
      });
      if (b.length > 0) {
        setQualificationMatches(b);
      }
    }
  }, [reportsById, matches, showSubmittedMatches]);

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
    api.setCompPublicData(comp?._id, e.target.checked);
  }
    
  function remindUserOnSlack(slackId: string) {
    if (slackId && session?.user?.slackId && team?._id && isManager && confirm("Remind scouter on Slack?"))
      api.remindSlack(slackId, session?.user?.slackId, team._id);
  }

  function addTeam() {
    console.log("Adding pit report for team", teamToAdd);
    if (!teamToAdd || !comp?._id) return;

    api.createPitReportForTeam(teamToAdd, comp?._id)
    .catch((e) => {
      console.error(e);

      // Save pit report to local storage
      if (!comp._id)
        return;

      console.log("Adding pit report to local storage");
      updateCompInLocalStorage(comp?._id, (comp) => {
        const pitreport = {
          ...new Pitreport(teamToAdd, games[comp.comp.gameId].createPitReportData()),
          _id: new BSON.ObjectId().toHexString()
        };
        comp.pitReports[teamToAdd] = pitreport;
        comp.comp.pitReports.push(pitreport._id!);
      });
    })
    .finally(() => {
      location.reload();
    });
  }

  async function saveCompChanges() {
    // Check if tbaId is valid
    if (!comp?.tbaId || !comp?.name || !comp?._id) return;

    let tbaId = newCompTbaId;
    const autoFillData = await api.getCompetitionAutofillData(tbaId ?? "");
    if (!autoFillData.name) {
      if(!confirm(`Invalid TBA ID: ${tbaId}. Save changes anyway?`))
        return;
      tbaId = NotLinkedToTba;
    }

    await api.updateCompNameAndTbaId(comp?._id, newCompName ?? "Unnamed", tbaId ?? NotLinkedToTba);
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
    
    return savedComp;
  }

  function setSavedCompetition(comp: SavedCompetition) {
    saveCompToLocalStorage(comp);

    location.reload();
  }

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
      <div className="min-h-screen w-screen flex flex-col sm:flex-row grow-0 items-center justify-center max-sm:content-center sm:space-x-6 space-y-2 overflow-hidden max-sm:my-4 md:ml-4">
        <div className="w-[90%] sm:w-2/5 flex flex-col grow-0 space-y-14 h-full">
          <div className="w-full card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="flex flex-row items-center justify-between w-full">
                <h1 className="card-title text-3xl font-bold">
                  {comp?.name}
                </h1>
                <button onClick={openDownloadModal} className="btn btn-ghost flex flex-row">
                  <BiExport size={30} />
                  <div className="max-sm:hidden">
                    Import/Export
                  </div>
                </button>
              </div>
              <div className="divider"></div>
              <div className="w-full flex flex-col sm:flex-row items-center mt-4 max-sm:space-y-1">
                <a
                  className={`max-sm:w-full btn btn-${comp?.tbaId !== NotLinkedToTba ? "primary" : "disabled"}`}
                  href={"/event/" + comp?.tbaId}
                >
                  Rankings <MdAutoGraph size={30} />
                </a>
                <div className="divider divider-horizontal"></div>
                <a
                  className="max-sm:w-full btn btn-secondary"
                  href={`${comp?.slug}/stats`}
                >
                  Stats <MdQueryStats size={30} />
                </a>
                <div className="divider divider-horizontal"></div>
                <a
                  className="max-sm:w-full btn btn-accent"
                  href={`${comp?.slug}/pitstats`}
                >
                  Pit Stats <MdCoPresent size={30} />
                </a>
              </div>
            </div>
          </div>

          <div className="w-full card bg-base-200 shadow-xl">
            <div className="card-body w-full">
              <div
                role="tablist"
                className="mt-3 tabs tabs-boxed rounded-b-none bg-base-200 w-full max-sm:w-full -translate-y-10"
              >
                <a
                  role="tab"
                  className={`tab ${!showSettings ? "tab-active" : ""}`}
                  onClick={() => {
                    setShowSettings(false);
                  }}
                >
                  Scouting Insights
                </a>
                {isManager ? (
                  <a
                    role="tab"
                    className={`tab ${showSettings ? "tab-active" : ""}`}
                    onClick={() => {
                      setShowSettings(true);
                    }}
                  >
                    Settings
                  </a>
                ) : (
                  <a role="tab" className="tab tab-disabled">
                    Settings
                  </a>
                )}
              </div>
              <div className="divider"></div>
              {showSettings ? (
                <div className="w-full">
                  {
                    comp?.tbaId === NotLinkedToTba && <>
                      <div className="w-full flex flex-col items-center justify-center">
                        <h1 className="text-red-500">This competition is not linked to TBA</h1>
                        <p>Some features will be unavailable.</p>
                      </div>
                      <div className="divider"></div>
                    </>
                  }
                  <h1 className="font-semibold text-xl">Settings</h1>
                  <div className="flex flex-col space-y-2 mt-1">
                    { comp?.tbaId !== NotLinkedToTba &&
                      <button
                        onClick={reloadCompetition}
                        className="btn btn-md btn-warning w-full"
                      >
                        <FaSync></FaSync> Reload Comp from TBA
                      </button>
                    }
                    <button
                      className={
                        "btn btn-primary w-full " +
                        (assigningMatches ? "disabled" : "")
                      }
                      // disabled={true}
                      onClick={() =>
                        confirm("Are you sure? This cannot be undone!") &&
                        assignScouters()
                      }
                    >
                      {!assigningMatches ? (
                        "Re-Assign Matches"
                      ) : (
                        <BsGearFill
                          className="animate-spin-slow"
                          size={30}
                        ></BsGearFill>
                      )}
                    </button>

                    <button
                      className={`btn ${
                        exportPending ? "btn-disabled" : "btn-primary"
                      } `}
                      onClick={exportAsCsv}
                    >
                      {exportPending ? (
                        <div className="loading loading-bars loading-sm"></div>
                      ) : (
                        "Export Scouting Data as CSV"
                      )}
                    </button>
                    <div className="flex flex-row items-center justify-between w-full">
                      <label className="label ml-4">Show Submitted Matches</label>
                      <input type="checkbox" className="checkbox checkbox-lg checkbox-primary mr-4" checked={showSubmittedMatches} onChange={toggleShowSubmittedMatches} />
                    </div>
                  </div>

                  {/* <button
                    className="btn btn-warning"
                    onClick={() => {
                      if (confirm("Are you sure you want to regenerate pit reports? Doing so will overwrite existing pit reports."))
                        regeneratePitReports();
                    }}
                    >
                      Regenerate Pit Reports
                  </button> */}

                  <div className="divider"></div>
                  <h1 className="font-semibold">Edit comp information</h1>
                  <div>Game: {games[comp?.gameId ?? defaultGameId].name}</div>
                  <div className="flex flex-row items-center justify-between">
                    <label className="label">Competition Name</label>
                    <input
                      type="text"
                      className="input input-bordered w-2/3"
                      value={newCompName}
                      onChange={(e) => {
                        setNewCompName(e.target.value);
                      }}
                    />
                  </div>
                  <div className="flex flex-row items-center justify-between mb-2"> 
                    <label className="label">TBA ID</label>
                      <input
                        type="text"
                        className="input input-bordered w-2/3"
                        value={newCompTbaId}
                        onChange={(e) => {
                          setNewCompTbaId(e.target.value);
                        }}
                      />
                  </div>
                  <button className="btn btn-primary w-full" onClick={saveCompChanges}>Save</button>

                  <div className="divider"></div>
                  <h1 className="font-semibold">Manually add matches</h1>

                  <div className="flex flex-row">
                    <div className="w-1/2 flex flex-col items-center">
                      <h1 className="text-red-500 font-bold text-xl">Red</h1>
                      <div className="flex flex-row items-center justify-evenly">
                        {
                          allianceIndices.map((index) =>
                            <input
                              key={index}
                              type="text"
                              placeholder={`Team ${index + 1}`}
                              className="input input-sm  input-bordered w-1/4"
                              value={!redAlliance[index] || isNaN(redAlliance[index]) ? "" : redAlliance[index]}
                              onChange={(e) => {
                                const c = structuredClone(redAlliance);
                                c[index] = Number(e.target.value);
                                setRedAlliance(c);
                              }}
                            />
                          )
                        }
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col items-center">
                      <h1 className="text-blue-500 font-bold text-xl">Blue</h1>
                      <div className="flex flex-row items-center justify-evenly">
                        {
                          allianceIndices.map((index) =>
                            <input
                              key={index}
                              type="text"
                              placeholder={`Team ${index + 1}`}
                              className="input input-sm  input-bordered w-1/4"
                              value={blueAlliance[index]}
                              onChange={(e) => {
                                const c = structuredClone(blueAlliance);
                                c[index] = Number(e.target.value);
                                setBlueAlliance(c);
                              }}
                            />
                          )
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      type="number"
                      placeholder="Match #"
                      className="input input-md input-bordered w-1/3 mt-2"
                      value={matchNumber}
                      onChange={(e) => {
                        setMatchNumber(Number(e.target.value));
                      }}
                    ></input>
                  </div>

                  <button
                    className="btn btn-accent w-full mt-2"
                    disabled={!matchNumber}
                    onClick={createMatch}
                  >
                    Create
                  </button>
                  
                  <div className="divider"></div>
                  <h1 className="font-semibold">Manually add pit reports</h1>

                  <input
                    type="number"
                    placeholder="Team #"
                    className="input input-md input-bordered w-full mt-2"
                    value={teamToAdd}
                    onChange={(e) => {setTeamToAdd(Number(e.target.value));}}
                  />

                  <button
                    className="btn btn-accent w-full mt-2"
                    disabled={!teamToAdd}
                    onClick={addTeam}
                  >
                    Add
                  </button>
                  
                  { comp?.tbaId !== NotLinkedToTba && <>
                    <div className="divider"></div>
                    <div className="flex flex-row justify-between items-center">
                      <p className="text-2xl">Make data public?</p>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        id="toggle-public-data"
                        defaultChecked={comp?.publicData}
                        onChange={togglePublicData}
                      />
                    </div>
                    <p className="text-xs">
                      Making your data publicly available helps smaller teams make informed decisions during alliance selection. 
                      Don&apos;t worry - no identifying information will be shared and comments will be hidden; only quantitative
                      data will be shared.<br/>This setting can be changed at any time.
                    </p>
                  </>}

                  <div className="divider"></div>
                  <Link href={`/${team?.slug}/${seasonSlug}/${comp?.slug}/scouters`}>
                    <button className="btn btn-lg btn-primary w-full">
                      <FaBinoculars /> Manage Scouters
                    </button>
                  </Link>
                </div>
              ) : (
                <div>
                  <h1 className="font-semibold text-lg">Scouting Progress</h1>
                  <div className="stats bg-base-300 w-full shadow-xl">
                    <div className="stat space-y-2">
                      <div className="stat-figure text-accent">
                        <BsClipboard2Check size={65}></BsClipboard2Check>
                      </div>
                      <div className="stat-title text-slate-400">
                        Competition Progress
                      </div>
                      <div className="stat-value text-accent">
                        {submittedReports && !Number.isNaN(submittedReports)
                          ? Round(submittedReports / reports.length) * 100
                          : "?"}
                        %
                      </div>
                      <div className="stat-desc"></div>
                    </div>

                    <div className="stat space-y-2">
                      <div className="stat-figure text-primary">
                        <FaUserCheck size={65}></FaUserCheck>
                      </div>
                      <div className="stat-title text-slate-400">
                        Scouter Submission
                      </div>
                      {loadingScoutStats ? (
                        <div className="stat-value text-primary">
                          <BsGearFill size={45} className="animate-spin-slow" />
                        </div>
                      ) : (
                        <div>
                          <div className="stat-value text-primary">
                            {submittedReports && !Number.isNaN(submittedReports)
                              ? Round(submittedReports / reports.length) * 100
                              : "?"}
                            %
                          </div>
                          <div className="stat-desc">
                            {submittedReports}/{reports.length} Reports
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <h1 className="font-semibold text-lg">
                    Pitscouting Progress
                  </h1>
                  <div className="stats mt-2 w-full">
                    <div className="stat place-items-center">
                      <div className="stat-title">Teams</div>
                      <div className="stat-figure text-primary">
                        <FaUserGroup size={40}></FaUserGroup>
                      </div>
                      <div className="stat-value text-primary">
                        {!submittedPitreports && submittedPitreports !== 0
                          ? "?"
                          : submittedPitreports}
                        /
                        {!pitreports || pitreports.length === 0
                          ? "?"
                          : pitreports.length}
                      </div>
                    </div>

                    <div className="stat place-items-center">
                      <div className="stat-figure text-accent">
                        <FaDatabase size={40}></FaDatabase>
                      </div>
                      <div className="stat-title">Datapoints</div>
                      <div className="stat-value text-accent">
                        {!submittedPitreports && submittedPitreports !== 0
                          ? "?"
                          : (submittedPitreports * 8).toLocaleString()}
                        /
                        {!pitreports || pitreports.length === 0
                          ? "?"
                          : (pitreports.length * 8).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col max-sm:items-center  h-screen space-y-4">
          <div className="max-w-screen-md max-sm:w-11/12 card bg-base-200 shadow-xl ">
            <div className="card-body">
              <h1 className="card-title text-2xl md:text-3xl font-bold">
                {team?.name} - {team?.number}
                {ranking && (
                  <span className="text-accent">
                    (#{ranking.place}/{ranking.max})
                  </span>
                )}
              </h1>
              {isManager && matchesAssigned === false && Object.keys(usersById).length >= 6 ? (
                matchesAssigned !== undefined
                  ? (
                    <div className="opacity-100 font-bold text-warning flex flex-row items-center justify-start space-x-3">
                      <div>{!assigningMatches ? "Matches are not assigned" : "Assigning matches"}</div>
                        {!assigningMatches ? (
                          <button
                            className={
                              "btn btn-primary btn-sm " +
                              (assigningMatches ? "disabled" : "")
                            }
                            onClick={assignScouters}
                          >
                            Assign Matches
                          </button>
                        ) : (
                          <BsGearFill size={30} className="animate-spin-slow text-white" />
                        )}
                    </div>)
                  : (<progress className="progress w-full" />)
              ) : <></>}
              <div className="divider my-0"></div>
              {loadingMatches || loadingReports || loadingUsers ? (
                <div className="w-full flex flex-col items-center justify-center">
                  <BsGearFill
                    className="animate-spin-slow"
                    size={75}
                  />
                  {loadingMatches && <h1>Loading Matches...</h1>}
                  {loadingReports && <h1>Loading Reports...</h1>}
                  {loadingUsers && <h1>Loading Users...</h1>}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-2">
                  {noMatches ? (
                    <div className="flex flex-col items-center justify-center font-bold space-y-4">
                      <h1>No Match Schedule Available</h1>
                      <button
                        onClick={reloadCompetition}
                        className="btn btn-lg btn-primary"
                      >
                        <FaSync></FaSync> Refresh
                      </button>
                      <h1>{updatingComp}</h1>
                    </div>
                  ) : (
                    <div>
                      <div
                        className=
                          "carousel carousel-center max-w-lg max-sm:max-w-sm h-56 p-4 space-x-4 bg-transparent rounded-box overflow-y-visible"
                      >
                        {qualificationMatches.map((match, index) => (
                          <div
                            className="carousel-item max-sm:scale-[75%] bg-base-20 w-full flex flex-col items-center md:-translate-y-[34px]"                            key={match._id}
                          >
                            <div
                              id={`//match${index}`}
                              className="md:relative md:-translate-y-80"
                            />
                            <div className="items-middle flex flex-row items-center pt-4">
                              <h1 className="text-2xl font-bold">
                                Match {match.number}
                              </h1>
                              { isManager && <button className="btn btn-link" onClick={() => openEditMatchModal(match)}>Edit</button>}
                            </div>
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-full flex flex-row items-center space-x-2">
                                {match.reports.map((reportId) => {
                                  const report = reportsById[reportId];

                                  if (!report) return (
                                    <MdErrorOutline size={24} />
                                  );

                                  const submitted = report.submitted;
                                  const mine = session && report.user === session.user?._id;
                                  const ours = report.robotNumber === team?.number;
                                  let color = !submitted
                                    ? report.color === AllianceColor.Red
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                    : "bg-slate-500";
                                  color = ours ? !report.submitted ? "bg-purple-500" : "bg-purple-300" : color;

                                  const timeSinceCheckIn = report.checkInTimestamp && (new Date().getTime() - new Date(report.checkInTimestamp as any).getTime()) / 1000;
                              
                                  return (
                                    <Link
                                      href={isOnline 
                                        ? `/${team?.slug}/${seasonSlug}/${comp?.slug}/${reportId}`
                                        : `/offline/${comp?._id}/quant/${reportId}`
                                      }
                                      key={reportId}
                                      className={`${color} ${mine && !submitted ? "border-4": "border-2"} 
                                        ${timeSinceCheckIn && timeSinceCheckIn < 10 && "avatar online"} 
                                        rounded-lg w-12 h-12 flex items-center justify-center text-white  border-white`
                                      }
                                    >
                                      <h1>{report.robotNumber}</h1>
                                    </Link>
                                  );
                                })}
                              </div>

                              <div className="w-full flex flex-row items-center space-x-2">
                                {match.reports.map((reportId) => {
                                  const report = reportsById[reportId];
                                  //@ts-ignore
                                  const user = usersById[report?.user];

                                  return (
                                    <div
                                      className="tooltip tooltip-bottom "
                                      data-tip={user?.name}
                                      key={reportId}
                                    >
                                      { user ?
                                        <Avatar
                                          user={user}
                                          scale="w-12"
                                          imgHeightOverride="h-12"
                                          showLevel={false}
                                          borderThickness={2}
                                          onClick={() => remindUserOnSlack(user._id)}
                                        />
                                        : <div className="w-12 h-12"></div>
                                      }
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              {
                                match.subjectiveScouter && usersById[match.subjectiveScouter]
                                  ?
                                    <div className="flex flex-row items-center space-x-1">
                                      { match.assignedSubjectiveScouterHasSubmitted
                                        ? <FaCheck className="text-green-500" size={24} />
                                        : (match.subjectiveReportsCheckInTimestamps && getIdsInProgressFromTimestamps(match.subjectiveReportsCheckInTimestamps)
                                          .includes(match.subjectiveScouter)) &&
                                          <div className="tooltip" data-tip="Scouting in progress"><Loading size={24}/></div>}
                                      { isManager && usersById[match.subjectiveScouter ?? ""]?.slackId
                                        ? <button className="text-primary hover:underline mb-1" 
                                              onClick={() => remindUserOnSlack(usersById[match.subjectiveScouter ?? ""]?.slackId)}>
                                            Subjective Scouter: {usersById[match.subjectiveScouter].name}
                                          </button>
                                        : <div>Subjective Scouter: {usersById[match.subjectiveScouter ?? ""].name}</div>
                                      }
                                    </div>
                                  : <div>No subjective scouter assigned</div>
                              }
                              </div>
                            <Link className={`btn btn-primary btn-sm ${match.subjectiveScouter && usersById[match.subjectiveScouter]?.slackId && "-translate-y-1"}`} 
                              href={isOnline 
                                      ? `/${team?.slug}/${seasonSlug}/${comp?.slug}/${match._id}/subjective`
                                      : `/offline/${comp?._id}/subjective/${match._id}`
                              }>
                              Add Subjective Report ({`${match.subjectiveReports ? match.subjectiveReports.length : 0} submitted, 
                                ${match.subjectiveReportsCheckInTimestamps 
                                  ? getIdsInProgressFromTimestamps(match.subjectiveReportsCheckInTimestamps).length 
                                  : 0} in progress`})
                            </Link>
                        </div>
                        ))}
                      </div>
                      <div className="w-full flex items-center justify-center mt-2">
                        <kbd className="kbd">← Scroll →</kbd>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="max-w-screen-md max-sm:w-11/12 card bg-base-200 shadow-xl h-56">
            {pitreports.length === 0 && !loadingPitreports ? (
              <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Pitscouting not available
                </h1>
                <div>
                  {comp?.tbaId !== NotLinkedToTba ? "Could not fetch team list from TBA" : "You'll need to manually add teams from Settings" }
                </div>
              </div>
            ) : (
              <div className="sm:card-body grow-0">
                <h1 className="max-sm:ml-3 card-title max-sm:pt-2">
                  Pitscouting
                </h1>
                <div className="overflow-x-scroll flex flex-row space-x-5 h-36 max-sm:ps-1">
                  {loadingPitreports ? (
                    <div className="w-full flex items-center justify-center">
                      <BsGearFill
                        className="animate-spin-slow"
                        size={75}
                      />
                    </div>
                  ) : (
                    pitreports
                      ?.sort((a, b) => a.teamNumber - b.teamNumber)
                      ?.map((report) => (
                        <Link
                          className="card mt-2 bg-base-100 hover:bg-base-200 p-2 h-3/4"
                          href={window.location.href + `/pit/${report._id}`}
                          key={report._id}
                        >
                          <div className="relative rounded-t-lg h-6 z-20 w-16 -translate-y-2 font-bold text-center">
                            {report.teamNumber}
                          </div>
                          <div className="absolute rounded z-10 translate-y-4 flex justify-center items-center">
                            {report.submitted ? (
                              <img
                                alt="img"
                                src={report.data?.image}
                                loading="lazy"
                                style={{ imageResolution: "72dpi" }}
                                className="w-2/3 h-auto rounded-lg"
                              ></img>
                            ) : (
                              <FaRobot size={64} />
                            )}
                          </div>
                        </Link>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
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
        { (team && comp) &&
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