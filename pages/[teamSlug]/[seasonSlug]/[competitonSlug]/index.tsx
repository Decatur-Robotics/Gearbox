import { ChangeEvent, useEffect, useState } from "react";

import ClientApi from "@/lib/api/ClientApi";
import {
  Match,
  MatchType,
  Pitreport,
  Report,
  SubjectiveReport,
  User,
  Team,
  Competition,
  DbPicklist,
  Season
} from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import useInterval from "@/lib/client/useInterval";
import { NotLinkedToTba, download, getIdsInProgressFromTimestamps, makeObjSerializeable } from "@/lib/client/ClientUtils";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";
import { GetServerSideProps } from "next";
import UrlResolver from "@/lib/UrlResolver";
import Container from "@/components/Container";
import CompHeaderCard from "@/components/competition/CompHeaderCard";
import EditMatchModal from "@/components/competition/EditMatchModal";
import InsightsAndSettingsCard from "@/components/competition/InsightsAndSettingsCard";
import MatchScheduleCard from "@/components/competition/MatchScheduleCard";
import PitScoutingCard from "@/components/competition/PitScoutingCard";

const api = new ClientApi();

export default function CompetitionIndex({ team, competition: comp, season }: {
  team: Team | undefined,
  competition: Competition | undefined,
  season: Season | undefined,
}) {

  const { session, status } = useCurrentSession();
  const isManager = (session?.user?._id !== undefined && team?.owners.includes(session?.user?._id)) ?? false;

  const [showSettings, setShowSettings] = useState(false);
  const [matchNumber, setMatchNumber] = useState<number | undefined>(undefined);
  const [blueAlliance, setBlueAlliance] = useState<number[]>([]);
  const [redAlliance, setRedAlliance] = useState<number[]>([]);

  const [matches, setMatches] = useState<Match[]>([]);

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
    max: number | string;
  } | null>(null);

  const [matchBeingEdited, setMatchBeingEdited] = useState<string | undefined>();

  const [teamToAdd, setTeamToAdd] = useState<number>(0);

  const [newCompName, setNewCompName] = useState(comp?.name);
  const [newCompTbaId, setNewCompTbaId] = useState(comp?.tbaId);

  const regeneratePitReports = async () => {
    console.log("Regenerating pit reports...");
    api
      .regeneratePitReports(comp?._id!)
      .then(({ pitReports }: { pitReports: string[] }) => {
        setAttemptedRegeneratingPitReports(true);
        setLoadingPitreports(true);

        // Fetch pit reports
        const pitReportPromises = pitReports.map(
          api.findPitreportById
        );

        Promise.all(pitReportPromises).then((reports) => {
          console.log("Got all pit reports");
          setPitreports(reports.filter((r) => r !== undefined) as Pitreport[]);
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
    let matches: Match[] = await api.allCompetitionMatches(comp?._id!);

    if (!matches || matches.length === 0) {
      setNoMatches(true);

      if (!silent)
        setLoadingMatches(false);

      return;
    }
    
    matches?.sort((a, b) => a.number - b.number);

    setMatches(matches);

    api.getSubjectiveReportsFromMatches(comp?._id ?? "", matches).then((reports) => {
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
      comp?._id!,
      false,
      false
    );

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
        promises.push(api.findUserById(userId)
          .then((user) => {
            if (user) {
              newUsersById[userId] = user;
            }
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
      api.getPicklistFromComp(comp?._id).then(setPicklists).catch(console.error);

    // Resync pit reports if none are present
    if (!attemptedRegeneratingPitReports && comp?.pitReports.length === 0) {
      regeneratePitReports();
    }
  }, [assigningMatches]);

  const assignScouters = async () => {
    setAssigningMatches(true);
    const res = await api.assignScouters(comp?._id!, true);

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
    const res = await api.reloadCompetition(comp?._id!);
    if (res.result === "success") {
      window.location.reload();
    } else {
      setUpdatingComp("None found");
    }
  };

  const createMatch = async () => {
    try {
      await api.createMatch(
        comp?._id!,
        Number(matchNumber),
        0,
        MatchType.Qualifying,
        blueAlliance as number[],
        redAlliance as number[]
      );
    } catch (e) {
      console.error(e);
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

    const res = await api.exportCompAsCsv(comp?._id!).catch((e) => {
      console.error(e);
      return { csv: undefined };
    });

    if (!res) {
      console.error("failed to export");
    }

    if (res.csv) {
      download(`${comp?.name ?? "Competition"}.csv`, res.csv, "text/csv");
    } else {
      console.error("No CSV data returned from server");
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

  function togglePublicData(e: ChangeEvent<HTMLInputElement>) {
    if (!comp?._id) return;
    api.setCompPublicData(comp?._id, e.target.checked);
  }
    
  function remindUserOnSlack(slackId: string) {
    if (slackId && session?.user?.slackId && team?._id && isManager && confirm("Remind scouter on Slack?"))
      api.remindSlack(team._id.toString(), slackId);
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
    const autoFillData = await api.competitionAutofill(tbaId ?? "");
    if (!autoFillData?.name && !confirm(`Invalid TBA ID: ${tbaId}. Save changes anyway?`))
        return;

    await api.updateCompNameAndTbaId(comp?._id, newCompName ?? "Unnamed", tbaId ?? NotLinkedToTba);
    location.reload();
  }

  const allianceIndices: number[] = [];
  for (let i = 0; i < games[comp?.gameId ?? defaultGameId].allianceSize; i++) {
    allianceIndices.push(i);
  }

  return (
    <Container requireAuthentication title={comp?.name ?? "Competition Loading"}>
      <div className="min-h-screen w-full flex flex-col sm:flex-row flex-grow justify-center sm:space-x-6 my-4">
        <div className="w-full sm:w-2/5 flex flex-col items-center flex-grow justify-center space-y-4 h-full">
          <CompHeaderCard comp={comp} />
          <InsightsAndSettingsCard 
            showSettings={showSettings} setShowSettings={setShowSettings} isManager={isManager} comp={comp}
            newCompName={newCompName} setNewCompName={setNewCompName} newCompTbaId={newCompTbaId} setNewCompTbaId={setNewCompTbaId}
            saveCompChanges={saveCompChanges} togglePublicData={togglePublicData} exportAsCsv={exportAsCsv}
            exportPending={exportPending} regeneratePitReports={regeneratePitReports} reloadCompetition={reloadCompetition}
            toggleShowSubmittedMatches={toggleShowSubmittedMatches} showSubmittedMatches={showSubmittedMatches}
            pitreports={pitreports} submittedPitreports={submittedPitreports} addTeam={addTeam} teamToAdd={teamToAdd} 
            setTeamToAdd={setTeamToAdd} seasonSlug={season?.slug} assignScouters={assignScouters} assigningMatches={assigningMatches}
            redAlliance={redAlliance} setRedAlliance={setRedAlliance} blueAlliance={blueAlliance} setBlueAlliance={setBlueAlliance}
            matchNumber={matchNumber} setMatchNumber={setMatchNumber} createMatch={createMatch} allianceIndices={allianceIndices}
            submittedReports={submittedReports} team={team} reports={reports} loadingScoutStats={loadingScoutStats}
          />
        </div>

        <div className="w-full sm:w-1/2 flex flex-col flex-grow h-screen space-y-4">
          <MatchScheduleCard 
            matches={matches}
            usersById={usersById} reportsById={reportsById} comp={comp} isManager={isManager} openEditMatchModal={openEditMatchModal}
            loadingMatches={loadingMatches} loadingReports={loadingReports}
            loadingUsers={loadingUsers} team={team} ranking={ranking} noMatches={noMatches}
            matchesAssigned={matchesAssigned} assignScouters={assignScouters}
            assigningMatches={assigningMatches} remindUserOnSlack={remindUserOnSlack}
            reloadCompetition={reloadCompetition} seasonSlug={season?.slug} updatingComp={updatingComp}
            session={session} showSubmittedMatches={showSubmittedMatches}
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
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const resolved = await UrlResolver(context, 3);
  if ("redirect" in resolved) {
    return resolved;
  }

  return {
    props: {
      competition: resolved.competition ? makeObjSerializeable(resolved.competition) : null,
      team: resolved.team ? makeObjSerializeable(resolved.team) : null,
      season: resolved.season ? makeObjSerializeable(resolved.season) : null,
    },
  };
};
