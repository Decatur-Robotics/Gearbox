import { getIdsInProgressFromTimestamps } from "@/lib/client/ClientUtils";
import { AllianceColor, Competition, Match, Report, Team, User } from "@/lib/Types";
import Link from "next/link";
import { BsGearFill } from "react-icons/bs";
import { FaSync, FaCheck } from "react-icons/fa";
import { MdErrorOutline } from "react-icons/md";
import Avatar from "../Avatar";
import Loading from "../Loading";
import { AdvancedSession } from "@/lib/client/useCurrentSession";

export default function MatchScheduleCard(props: {
  team: Team | undefined;
  matches: Match[];
  ranking: { place: number | string; max: number } | null;
  loadingMatches: boolean;
  loadingReports: boolean;
  loadingUsers: boolean;
  noMatches: boolean;
  isManager: boolean | undefined;
  isOnline: boolean;
  matchesAssigned: boolean | undefined;
  assigningMatches: boolean;
  assignScouters: () => void;
  openEditMatchModal: (match: Match) => void;
  remindUserOnSlack: (userId: string) => void;
  reloadCompetition: () => void;
  comp: Competition | undefined;
  seasonSlug: string | undefined;
  reportsById: { [id: string]: Report };
  usersById: { [id: string]: User };
  qualificationMatches: Match[];
  updatingComp: string;
  session: AdvancedSession;
}) {
  const {
    team,
    matches,
    ranking,
    loadingMatches,
    loadingReports,
    loadingUsers,
    noMatches,
    isManager,
    isOnline,
    matchesAssigned,
    assigningMatches,
    assignScouters,
    openEditMatchModal,
    remindUserOnSlack,
    reloadCompetition,
    comp,
    seasonSlug,
    reportsById,
    usersById,
    qualificationMatches,
    updatingComp,
    session
  } = props;

  return (
    <div className="w-full card bg-base-200 shadow-xl ">
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
            {noMatches || matches.length === 0 ? (
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
                      key={match._id}
                      className="carousel-item max-sm:scale-[75%] bg-base-20 w-full flex flex-col items-center md:-translate-y-[34px]"
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
                              <MdErrorOutline key={reportId} size={24} />
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
  );
}