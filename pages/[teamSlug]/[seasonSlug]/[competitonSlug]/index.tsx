import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

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

import { MdAutoGraph, MdCoPresent, MdQueryStats } from "react-icons/md";
import { BsClipboard2Check, BsGear, BsGearFill } from "react-icons/bs";
import { FaDatabase, FaEdit, FaSync, FaUserCheck } from "react-icons/fa";
import { FaCheck, FaRobot, FaUserGroup } from "react-icons/fa6";
import { Round } from "@/lib/client/StatsMath";

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
  6;
  const [reports, setReports] = useState<Report[]>([]);
  const [matchesAssigned, setMatchesAssigned] = useState(false);
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
  const [submittedReports, setSubmittedReports] = useState(0);

  const [pitreports, setPitreports] = useState<Pitreport[]>([]);
  const [loadingPitreports, setLoadingPitreports] = useState(true);
  const [submittedPitreports, setSubmittedPitreports] = useState(0);
  const [
    attemptedRegeneratingPitReports,
    setAttemptedRegeneratingPitReports,
  ] = useState(false);

  const [updatingComp, setUpdatingComp] = useState("");

  const [ranking, setRanking] = useState<{
    place: number | string;
    max: number;
  } | null>(null);

  const regeneratePitReports = async () => {
    console.log("Regenerating pit reports...");
    api
      .regeneratePitReports(comp?.tbaId, comp?._id)
      .then(({ pitReports }: { pitReports: string[] }) => {
        setAttemptedRegeneratingPitReports(true);
        setLoadingPitreports(true);

        // Fetch pit reports
        const pitReportPromises = pitReports.map(
          async (id: string) => await api.findPitreportById(id)
        );

        Promise.all(pitReportPromises).then((reports) => {
          console.log("Got all pit reports");
          setPitreports(reports);
          setLoadingPitreports(false);
        });
      });
  };

  useEffect(() => {
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

    const loadUsers = async () => {
      setLoadingUsers(true);

      if (!team?.scouters) {
        return;
      }
      const newUsersById: { [key: string]: User } = {};
      for (const userId of team.scouters) {
        newUsersById[userId] = await api.findUserById(userId);
      }

      setUsersById(newUsersById);
      setLoadingUsers(false);
    };

    const loadMatches = async () => {
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

      if (matches.length > 0) {
        setMatchesAssigned(matches[0].reports.length > 0 ? true : false);
      } else {
        setNoMatches(true);
      }

      setQualificationMatches(
        matches.filter((match) => match.type === MatchType.Qualifying)
      );

      setMatches(matches);
      setLoadingMatches(false);
    };

    const loadReports = async () => {
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
    setUpdatingComp("Checking for Updates...");
    const res = await api.updateCompetition(comp?._id, comp?.tbaId);
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
      Object.keys(reportsById).length > 0
    ) {
      const b = qualificationMatches.filter((match) => {
        let s = true;
        if (match.number <= 11) {
          return false;
        }
        for (const id of match.reports) {
          const r = reportsById[id];
          if (!r.submitted) {
            s = false;
            console.log("broke");
            break;
          }
        }
        return !s;
      });
      if (b.length > 0) {
        setQualificationMatches(b);
      }
    }
  }, [reportsById, matches]);

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
                  className={`max-sm:w-full btn btn-secondary ${
                    noMatches || !matchesAssigned ? "btn-disabled" : ""
                  }`}
                  href={`${comp?.slug}/stats`}
                >
                  Stats <MdQueryStats size={30} />
                </a>
                <div className="divider divider-horizontal"></div>
                <a
                  className={`max-sm:w-full btn btn-accent ${
                    noMatches || !matchesAssigned ? "btn-disabled" : ""
                  }`}
                  href={`${comp?.slug}/pitstats`}
                >
                  Pit Stats <MdCoPresent size={30} />
                </a>
              </div>
            </div>
          </div>

          <div className="w-full card rounded-tl-none bg-base-200 shadow-xl">
            <div
              role="tablist"
              className="tabs tabs-boxed rounded-b-none bg-base-200 w-1/2 max-sm:w-full -translate-y-10"
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
            {showSettings ? (
              <div className="card-body md:min-w-[40rem]">
                <h1 className="font-semibold text-xl">Settings</h1>
                <div className="flex flex-row space-x-2">
                  <button
                    onClick={reloadCompetition}
                    className="btn btn-md btn-primary w-1/2"
                  >
                    <FaSync></FaSync> Refresh
                  </button>
                  <button
                    className={
                      "btn btn-primary w-1/2 " +
                      (assigningMatches ? "disabled" : "")
                    }
                    disabled={true}
                    onClick={assignScouters}
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
                </div>

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

                <button
                  className="btn btn-warning"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to regenerate pit reports? Doing so will overwrite existing pit reports."
                      )
                    )
                      regeneratePitReports();
                  }}
                >
                  Regenerate Pit Reports
                </button>

                <div className="divider"></div>
                <h1 className="font-semibold">Manually add matches</h1>

                <div className="flex flex-row">
                  <div className="w-1/2 flex flex-col items-center">
                    <h1 className="text-red-500 font-bold text-xl">Red</h1>
                    <div className="flex flex-row items-center justify-evenly">
                      <input
                        type="text"
                        placeholder="Team 1"
                        className="input input-sm  input-bordered w-1/4"
                        value={redAlliance[0]}
                        onChange={(e) => {
                          const c = structuredClone(redAlliance);
                          c[0] = Number(e.target.value);
                          setRedAlliance(c);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Team 2"
                        className="input input-sm  input-bordered w-1/4"
                        value={redAlliance[1]}
                        onChange={(e) => {
                          const c = structuredClone(redAlliance);
                          c[1] = Number(e.target.value);
                          setRedAlliance(c);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Team 3"
                        className="input input-sm  input-bordered w-1/4"
                        value={redAlliance[2]}
                        onChange={(e) => {
                          const c = structuredClone(redAlliance);
                          c[2] = Number(e.target.value);
                          setRedAlliance(c);
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-1/2 flex flex-col items-center">
                    <h1 className="text-blue-500 font-bold text-xl">Blue</h1>
                    <div className="flex flex-row items-center justify-evenly">
                      <input
                        type="text"
                        placeholder="Team 1"
                        className="input input-sm  input-bordered w-1/4"
                        value={blueAlliance[0]}
                        onChange={(e) => {
                          const c = structuredClone(blueAlliance);
                          c[0] = Number(e.target.value);
                          setBlueAlliance(c);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Team 2"
                        className="input input-sm  input-bordered w-1/4"
                        value={blueAlliance[1]}
                        onChange={(e) => {
                          const c = structuredClone(blueAlliance);
                          c[1] = Number(e.target.value);
                          setBlueAlliance(c);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Team 3"
                        className="input input-sm  input-bordered w-1/4"
                        value={blueAlliance[2]}
                        onChange={(e) => {
                          const c = structuredClone(blueAlliance);
                          c[2] = Number(e.target.value);
                          setBlueAlliance(c);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <input
                    type="text"
                    placeholder="Match Number"
                    className="input input-md input-bordered w-1/4"
                    value={matchNumber}
                    onChange={(e) => {
                      setMatchNumber(Number(e.target.value));
                    }}
                  ></input>
                </div>

                <button
                  className="btn btn-accent"
                  disabled={!matchNumber}
                  onClick={createMatch}
                >
                  Create
                </button>
              </div>
            ) : (
              <div className="card-body ">
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
                      {!Number.isNaN(submittedReports)
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
                          {!Number.isNaN(submittedReports)
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
                <h1 className="font-semibold text-lg">Pitscouting Progress</h1>
                <div className="stats mt-2">
                  <div className="stat place-items-center">
                    <div className="stat-title">Teams</div>
                    <div className="stat-figure text-primary">
                      <FaUserGroup size={40}></FaUserGroup>
                    </div>
                    <div className="stat-value text-primary">
                      {!submittedPitreports ? "?" : submittedPitreports}/
                      {!pitreports ? "?" : pitreports.length}
                    </div>
                  </div>

                  <div className="stat place-items-center">
                    <div className="stat-figure text-accent">
                      <FaDatabase size={40}></FaDatabase>
                    </div>
                    <div className="stat-title">Datapoints</div>
                    <div className="stat-value text-accent">
                      {!submittedPitreports
                        ? "?"
                        : (submittedPitreports * 8).toLocaleString()}
                      /
                      {!pitreports
                        ? "?"
                        : (pitreports.length * 8).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <div className="divider"></div>
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
                        className={
                          "carousel carousel-center max-w-lg max-sm:max-w-sm h-56 p-4 space-x-4 bg-transparent rounded-box "
                        }
                      >
                        {qualificationMatches.map((match, index) => (
                          <div
                            className={
                              "carousel-item max-sm:scale-[75%] bg-base-20 w-full flex flex-col items-center "
                            }
                            key={match._id}
                          >
                            <div
                              id={`//match${index}`}
                              className="md:relative md:-translate-y-80"
                            ></div>
                            <h1 className="text-2xl font-bold mb-4">
                              Match {match.number}
                            </h1>
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-full flex flex-row items-center space-x-2">
                                {!matchesAssigned ? (
                                  <div className="opacity-100 font-bold text-warning flex flex-col items-center space-y-2">
                                    Matches are not assigned
                                    <div className="divider "></div>
                                    <button
                                      className={
                                        "btn btn-primary " +
                                        (assigningMatches ? "disabled" : "")
                                      }
                                      onClick={assignScouters}
                                    >
                                      {!assigningMatches ? (
                                        "Assign Matches"
                                      ) : (
                                        <BsGearFill
                                          className="animate-spin-slow"
                                          size={30}
                                        ></BsGearFill>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <></>
                                )}
                                {match.reports.map((reportId) => {
                                  const report = reportsById[reportId];
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
                                  color = ours ? "bg-purple-500" : color;

                                  if (!report) return <></>;
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

                              <div className="w-full flex flex-row items-center space-x-4 ml-2">
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
                                      <div className="avatar">
                                        {/*Ternaries are fun*/}
                                        <div className="w-10 rounded-full">
                                          <img
                                            src={user?.image}
                                            onClick={() => {
                                              if (
                                                user.slackId &&
                                                session &&
                                                team?.owners?.includes(
                                                  session.user?._id ?? ""
                                                ) &&
                                                confirm(
                                                  "Remind scouter on Slack?"
                                                )
                                              ) {
                                                api.remindSlack(
                                                  user.slackId,
                                                  session.user?.slackId
                                                );
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
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
                <div>Could not fetch team list from TBA</div>
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
                          <div className="absolute rounded z-10 translate-y-4 items-center">
                            {/* {report.image !== "/robot.jpg" ? (
                            <img src={report.image}></img>
                          ) : (
                            <div className="w-full h-full skeleton flex items-center justify-center font-mono text-sm">
                              No Image
                            </div>
                          )} */}
                            {report.submitted ? (
                              <FaCheck size={64} />
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
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  var ctx = await UrlResolver(context);
  return {
    props: ctx,
  };
};
