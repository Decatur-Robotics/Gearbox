import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { defaultGameId } from "@/lib/client/GameId";
import { Round } from "@/lib/client/StatsMath";
import { games } from "@/lib/games";
import { Competition, Pitreport, Report, Team } from "@/lib/Types";
import Link from "next/link";
import { ChangeEvent } from "react";
import { BsGearFill, BsClipboard2Check } from "react-icons/bs";
import { FaSync, FaBinoculars, FaUserCheck, FaDatabase } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";

export default function InsightsAndSettingsCard(props: { 
    showSettings: boolean, 
    setShowSettings: (value: boolean) => void, 
    isManager: boolean | undefined,
    comp: Competition | undefined,
    reloadCompetition: () => void,
    assignScouters: () => void,
    exportAsCsv: () => void,
    exportPending: boolean,
    showSubmittedMatches: boolean,
    toggleShowSubmittedMatches: () => void,
    assigningMatches: boolean,
    regeneratePitReports: () => void,
    newCompName: string | undefined,
    setNewCompName: (value: string) => void,
    newCompTbaId: string | undefined,
    setNewCompTbaId: (value: string) => void,
    saveCompChanges: () => void,
    redAlliance: number[],
    setRedAlliance: (value: number[]) => void,
    blueAlliance: number[],
    setBlueAlliance: (value: number[]) => void,
    matchNumber: number | undefined,
    setMatchNumber: (value: number) => void,
    createMatch: () => void,
    teamToAdd: number,
    setTeamToAdd: (value: number) => void,
    addTeam: () => void,
    submittedReports: number | undefined,
    reports: Report[],
    loadingScoutStats: boolean,
    pitreports: Pitreport[],
    submittedPitreports: number | undefined,
    togglePublicData: (e: ChangeEvent<HTMLInputElement>) => void,
    seasonSlug: string | undefined,
    team: Team | undefined,
    allianceIndices: number[],
}) {
  const {
    showSettings,
    setShowSettings,
    isManager,
    comp,
    reloadCompetition,
    assignScouters,
    exportAsCsv,
    exportPending,
    showSubmittedMatches,
    toggleShowSubmittedMatches,
    assigningMatches,
    newCompName,
    setNewCompName,
    newCompTbaId,
    setNewCompTbaId,
    saveCompChanges,
    redAlliance,
    setRedAlliance,
    blueAlliance,
    setBlueAlliance,
    matchNumber,
    setMatchNumber,
    createMatch,
    teamToAdd,
    setTeamToAdd,
    addTeam,
    submittedReports,
    reports,
    loadingScoutStats,
    pitreports,
    submittedPitreports,
    togglePublicData,
    seasonSlug,
    team,
    allianceIndices,
  } = props;

  return (
    <div className="w-full card bg-base-200 shadow-xl">
      <div className="card-body w-full">
        <div className="w-full">
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
          <div className="w-full">
            <h1 className="font-semibold text-lg">Scouting Progress</h1>
            <div className="stats bg-base-300 w-full shadow-xl">
              <div className="stat space-y-2">
                <div className="stat-figure text-accent">
                  <BsClipboard2Check size={65} />
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
  );
}