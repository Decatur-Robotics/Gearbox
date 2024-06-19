import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { ChangeEvent, useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { GetServerSideProps } from "next";
import {
  AllianceColor,
  Match,
  MatchType,
  Pitreport,
  Report,
  User,
} from "@/lib/Types";
import Container from "@/components/Container";

import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import {
  MdAutoGraph,
  MdCoPresent,
  MdQueryStats,
} from "react-icons/md";
import { BsClipboard2Check, BsGearFill } from "react-icons/bs";
import { FaBinoculars, FaDatabase, FaSync, FaUserCheck } from "react-icons/fa";
import { FaCheck, FaRobot, FaUserGroup } from "react-icons/fa6";
import { Round } from "@/lib/client/StatsMath";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import useInterval from "@/lib/client/useInterval";
import { NotLinkedToTba, getIdsInProgressFromTimestamps } from "@/lib/client/ClientUtils";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";

const api = new ClientAPI("gearboxiscool");

export default function Home(props: ResolvedUrlData) {
  const team = props.team;
  const season = props.season;
  const comp = props.competition;

  const { session, status } = useCurrentSession();
  const isManager = session?.user?._id
    ? team?.owners.includes(session.user?._id)
    : false;

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

  const [reportsById, setReportsById] = useState<{ [key: string]: Report }>({});
  const [usersById, setUsersById] = useState<{ [key: string]: User }>({});

  //loading states
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingScoutStats, setLoadingScoutStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

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
    const matches: Match[] = await api.allCompetitionMatches(comp?._id);
    matches.sort((a, b) => {
      if (a.number < b.number) {
        return -1;
      }
      if (a.number > b.number) {
        return 1;
      }
      return 0;
    });

    if (matches.length === 0)
      setNoMatches(true);

    setQualificationMatches(
      matches.filter((match) => match.type === MatchType.Qualifying)
    );

    setMatches(matches);
    if (!silent)
      setLoadingMatches(false);
  };

  const loadReports = async () => {
    const scoutingStats = (reps: Report[]) => {
      setLoadingScoutStats(true);
      let submittedCount = 0;
      reps.forEach((report) => {
        if (report.submitted) {
          submittedCount++;
        }
      });

      setSubmittedReports(submittedCount);
      setLoadingScoutStats(false);
    };

    setLoadingReports(true);
    const newReports: Report[] = await api.competitionReports(
      comp?._id,
      false
    );
    setReports(newReports);
    var newReportId: { [key: string]: Report } = {};
    newReports.forEach((report) => {
      if (!report._id) {
        return;
      }
      newReportId[report._id] = report;
    });
    setReportsById(newReportId);
    setLoadingReports(false);
    scoutingStats(newReports);
  };

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);

      if (!team?.scouters || !team.subjectiveScouters) {
        return;
      }

      const newUsersById: { [key: string]: User } = {};
      for (const userId of team.users) {
        newUsersById[userId] = await api.findUserById(userId);
      }

      setUsersById(newUsersById);
      setLoadingUsers(false);
    };

    const loadPitreports = async () => {
      setLoadingPitreports(true);
      if (!comp?.pitReports) {
        return;
      }
      const newPitReports: Pitreport[] = [];
      let submitted = 0;
      for (const pitreportId of comp?.pitReports) {
        const pitreport = await api.findPitreportById(pitreportId);
        if (pitreport.submitted) {
          submitted++;
        }
        newPitReports.push(pitreport);
      }
      setSubmittedPitreports(submitted);
      setPitreports(newPitReports);
      setLoadingPitreports(false);
    };

    if (!assigningMatches) {
      loadUsers();
      loadMatches();
      loadReports();
      loadPitreports();
    }

    // Resync pit reports if none are present
    if (!attemptedRegeneratingPitReports && comp?.pitReports.length === 0) {
      regeneratePitReports();
    }
  }, [assigningMatches]);

  const assignScouters = async () => {
    setAssigningMatches(true);
    const res = await api.assignScouters(team?._id, comp?._id, true);

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
    await api.createMatch(
      comp?._id,
      Number(matchNumber),
      MatchType.Qualifying,
      blueAlliance as number[],
      redAlliance as number[]
    );
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

    loadMatches();
  }

  const [exportPending, setExportPending] = useState(false);

  const exportAsCsv = async () => {
    setExportPending(true);

    const res = await api.exportCompAsCsv(comp?._id).catch((e) => {
      console.error(e);
    });

    if (res.csv) {
      const blob = new Blob([res.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${comp?.name}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
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
  }

  useInterval(() => loadMatches(true), 5000);

  function EditMatchModal(props: { match?: Match }) {
    if (props.match === undefined) return (<></>);

    const teams = props.match.blueAlliance.concat(props.match.redAlliance);

    const reports = props.match.reports.map(reportId => reportsById[reportId]);
    if (!reports) return (<></>);

    function changeScouter(e: ChangeEvent<HTMLSelectElement>, report: Report) {
      e.preventDefault();

      const userId = e.target.value;
      if (!userId || !report || !report._id) return;

      console.log(`Changing scouter for report ${report._id} to ${userId}`);
      api.changeScouterForReport(report._id, userId).then(loadReports);
    }

    function changeSubjectiveScouter(e: ChangeEvent<HTMLSelectElement>) {
      e.preventDefault();

      const userId = e.target.value;
      if (!userId || !props.match?._id) return;

      console.log(`Changing subjective scouter for match ${props.match?._id} to ${userId}`);
      api.setSubjectiveScouterForMatch(props.match?._id, userId).then(loadMatches);
    }

    return (
      <dialog id="edit-match-modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">X</button>
          </form>
          <h3 className="text-xl">Editing Match {props.match?.number}</h3>
          <table className="space-x-2">
            <thead>
              <tr>
                <th>Position</th>
                <th>Team</th>
                <th>Scouter</th>
              </tr>
            </thead>
            {
              teams.map((team, index) => 
                <tr key={index}>
                  <td className={index < 3 ? "text-blue-500" : "text-red-500"}>{index < 3 ? "Blue" : "Red"} {index % 3 + 1}</td>
                  <td>{team}</td>
                  <td>
                    <select onChange={(e) => changeScouter(e, reports[index])}>
                      {
                        reports[index]?.user && usersById[reports[index].user ?? ""]
                          ? <option value={reports[index].user}>
                              {usersById[reports[index].user ?? ""]?.name}</option>
                          : <></>
                      }
                      <option value={undefined}>None</option>
                      {
                        Object.keys(usersById).filter(id => id !== reports[index]?.user).map(userId => 
                          <option key={userId} value={userId}>{usersById[userId]?.name ?? "Unknown"}</option>
                        )
                      }
                    </select>
                  </td>
                </tr>
              )
            }
          </table>
          <div className="flex flex-row space-x-2">
            <label>Subjective Scouter:</label>
            <select onChange={changeSubjectiveScouter}>
              {
                props.match?.subjectiveScouter && usersById[props.match.subjectiveScouter]
                  ? <option value={props.match.subjectiveScouter}>
                      {usersById[props.match.subjectiveScouter].name}</option>
                  : <></>
              }
              <option value={undefined}>None</option>
              {
                Object.keys(usersById).filter(id => id !== props.match?.subjectiveScouter).map(userId => 
                  <option key={userId} value={userId}>{usersById[userId]?.name ?? "Unknown"}</option>
                )
              }
            </select>
          </div>
        </div>
      </dialog>
    );
  }

  function togglePublicData(e: ChangeEvent<HTMLInputElement>) {
    if (!comp?._id) return;
    api.setCompPublicData(comp?._id, e.target.checked);
  }
    
  function remindUserOnSlack(slackId: string) {
    if (slackId && session && isManager && confirm("Remind scouter on Slack?"))
      api.remindSlack(slackId, session.user?.slackId);
  }

  function addTeam() {
    if (!teamToAdd || !comp?._id) return;

    api.createPitReportForTeam(teamToAdd, comp?._id).then(() => {
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

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      <div className="min-h-screen w-screen flex flex-col sm:flex-row grow-0 items-center justify-center max-sm:content-center sm:space-x-6 space-y-2 overflow-hidden max-sm:my-4 md:ml-4">
        <div className="w-[90%] sm:w-2/5 flex flex-col grow-0 space-y-14 h-full">
          <div className="w-full card bg-base-200 shadow-xl">
            <div className="card-body">
              <h1 className="card-title text-3xl font-bold">{comp?.name}</h1>
              <div className="divider"></div>
              <div className="w-full flex flex-col sm:flex-row items-center mt-4 max-sm:space-y-1">
                <a
                  className="max-sm:w-full btn btn-primary"
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
                              type="text"
                              placeholder={`Team ${index + 1}`}
                              className="input input-sm  input-bordered w-1/4"
                              value={redAlliance[index]}
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
                  <Link href={`/${team?.slug}/${season?.slug}/${comp?.slug}/scouters`}>
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
                <div className="w-full flex items-center justify-center">
                  <BsGearFill
                    className="animate-spin-slow"
                    size={75}
                  ></BsGearFill>
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
                            ></div>
                            <div className="items-middle flex flex-row items-center">
                              <h1 className="text-2xl font-bold">
                                Match {match.number}
                              </h1>
                              { isManager && <button className="btn btn-link" onClick={() => openEditMatchModal(match)}>Edit</button>}
                            </div>
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-full flex flex-row items-center space-x-2">
                                
                                {match.reports.map((reportId) => {
                                  const report = reportsById[reportId];
                                  if (!report) return <></>;

                                  const submitted = report.submitted;
                                  const mine =
                                    report.user === session.user?._id;
                                  const ours =
                                    report.robotNumber === team?.number;
                                  let color = !submitted
                                    ? report.color === AllianceColor.Red
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                    : "bg-slate-500";
                                  color = ours ? !report.submitted ? "bg-purple-500" : "bg-purple-300" : color;
                                  return (
                                    <Link
                                      href={`/${team?.slug}/${season?.slug}/${comp?.slug}/${reportId}`}
                                      key={reportId}
                                      className={`${color} ${
                                        mine && !submitted
                                          ? "border-4"
                                          : "border-2"
                                      }  rounded-lg w-12 h-12 flex items-center justify-center text-white  border-white`}
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
                                        ? <button className="btn btn-link p-0 m-0" 
                                            onClick={() => remindUserOnSlack(usersById[match.subjectiveScouter ?? ""]?.slackId)}>
                                            Subjective Scouter: {usersById[match.subjectiveScouter].name}
                                          </button>
                                        : <div>Subjective Scouter: {usersById[match.subjectiveScouter ?? ""].name}</div>
                                      }
                                    </div>
                                  : <div>No subjective scouter assigned</div>
                              }
                            </div>
                            <Link className={`btn btn-primary btn-sm ${match.subjectiveScouter && usersById[match.subjectiveScouter].slackId && "-translate-y-1"}`} 
                              href={`/${team?.slug}/${season?.slug}/${comp?.slug}/${match._id}/subjective`}>
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
                      ></BsGearFill>
                    </div>
                  ) : (
                    pitreports
                      .sort((a, b) => a.teamNumber - b.teamNumber)
                      .map((report) => (
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
      </div>
      {
        isManager && <EditMatchModal match={matches.find(m => m._id === matchBeingEdited!)} />
      }
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  var ctx = await UrlResolver(context);
  return {
    props: ctx,
  };
};
