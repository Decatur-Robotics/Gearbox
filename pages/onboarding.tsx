import Container from "@/components/Container";
import Loading from "@/components/Loading";
import { League, Season, Team } from "@/lib/Types";
import ClientAPI from "@/lib/client/ClientAPI";
import { useCurrentSession } from "@/lib/client/hooks/useCurrentSession";
import useDynamicState from "@/lib/client/hooks/useDynamicState";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { defaultGameId, GameId } from "@/lib/client/GameId";
import { games } from "@/lib/games";
import { Analytics } from "@/lib/client/Analytics";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";

const api = new ClientAPI("gearboxiscool")

export default function Onboarding() {
  const { session, status } = useCurrentSession();
  const router = useRouter();

  const [league, setLeague] = useState<League>();
  const [teamNumber, setTeamNumber, getTeamNumber] = useDynamicState<number | undefined>();
  const [team, setTeam] = useState<{ 
    _id?: string, 
    name: string, 
    number: number, 
    slug?: string,
    tbaId?: string, 
    users?: string[],
    requests?: string[]
  }>();
  const [teamConfirmed, setTeamConfirmed] = useState<boolean>(false);

  enum JoinRequestStatus {
    NotRequested,
    Requested,
    Rejected,
    CreatedTeam
  }
  const [joinRequestStatus, setJoinRequestStatus] = useState<JoinRequestStatus>(JoinRequestStatus.NotRequested);
  const [season, setSeason] = useState<Season>();
  const [seasonCreated, setSeasonCreated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>();
  
  const gameId = league === League.FTC ? GameId.CenterStage : defaultGameId;
  const game = games[gameId];

  if (session?.user?.onboardingComplete)
    router.push("/profile");

  useEffect(() => {
    if (session?.user?.teams.length ?? 0 > 0)
      router.push(`/profile`);
  }, [session?.user?.email]);

  async function completeOnboarding(redirect: string = "/profile") {
    if (!session?.user?._id) return;

    api.setOnboardingCompleted(session?.user?._id);
    router.push(redirect);

    Analytics.onboardingCompleted(session?.user?.name ?? "Unknown User", teamNumber ?? -1, league ?? League.FRC);
  }

  async function teamNumberChanged(e: ChangeEvent<HTMLInputElement>) {
    const number = parseInt(e.target.value);
    console.log("Changed team # to", number);
    setTeamNumber(number);

    if (!number || isNaN(number)) setTeam(undefined);

    const team = await api.findTeamByNumberAndLeague(number, league ?? League.FRC)
                          .then(team => team.name ? team : api.getTeamAutofillData(number, league).catch(() => ({
                            number,
                            name: "",
                          })));

    setTeam(team);
    setJoinRequestStatus("requests" in team && (team.requests?.includes(session?.user?._id ?? "") ?? false) 
      ? JoinRequestStatus.Requested : JoinRequestStatus.NotRequested);
  }

  async function requestToJoinTeam() {
    if (!session?.user?._id || !teamNumber || !team) {
      console.error("Invalid request to join team");
      return;
    }

    setJoinRequestStatus(JoinRequestStatus.Requested);
    await api.requestToJoinTeam(session.user._id, team._id);
  }

  async function updateTeamRequestStatus() {
    if (!session?.user?._id || !teamNumber || !league) {
      console.error("Missing required fields to update team request status:", session?.user?._id, teamNumber, league);
      return;
    }

    console.log("Checking team request status for", teamNumber, league);

    const team = await api.findTeamByNumberAndLeague(teamNumber, league);

    const requestPending = team.requests?.includes(session?.user?._id ?? "") ?? false;
    if (joinRequestStatus === JoinRequestStatus.Requested && (team?.users?.includes(session?.user?._id ?? "") ?? false))
      completeOnboarding();

    if (requestPending)
      setJoinRequestStatus(JoinRequestStatus.Requested);
    else if (joinRequestStatus === JoinRequestStatus.Requested)
      setJoinRequestStatus(JoinRequestStatus.Rejected);
  }

  useEffect(() => { 
    const id = setInterval(updateTeamRequestStatus, 5000);
    return () => clearInterval(id);
   }, [session?.user?._id, teamNumber, league, joinRequestStatus]);

  async function createTeam() {
    if (!team?.name) {
      setErrorMsg("Team name cannot be empty");
      return;
    }

    if (!session?.user?._id || !teamNumber || !league) {
      console.error("Missing required fields to create team");
      return;
    }

    setTeam(await api.createTeam(team?.name, teamNumber, session?.user?._id, team?.tbaId ?? NotLinkedToTba, league));
    setJoinRequestStatus(JoinRequestStatus.CreatedTeam);
  }

  async function createSeason() {
    if (!session?.user?._id || !team?._id) return;

    setSeason(await api.createSeason(game.name, game.year, gameId, team?._id));
    setSeasonCreated(true);
  }

  return (
    <Container requireAuthentication={true} title="Onboarding">
      { !session?.user && <Loading size={64} /> }
      <div className="w-full flex justify-center p-12">
        <div className="card bg-base-200 w-2/3">
          <div className="card-body flex flex-col justify-between">
            <div> {/* This div is the main content, it's aligned with the top */}
              <div className="card-title gap-0">
                Welcome to<span className="text-accent ml-1">Gearbox</span>, {session?.user?.name?.split(' ')[0]}!
              </div>
              <div className="pb-6">
                Before you can start on your scouting journey, there&apos;s a bit of set up to do. It will only take a minute.
              </div>
              {
                !league ? 
                  <div>
                    <div className="text-xl">
                      What league are you in?
                    </div>
                    <button className="btn btn-accent mt-2 mr-2" onClick={() => setLeague(League.FRC)}>
                      FRC
                    </button>
                    <button className="btn btn-secondary mt-2" onClick={() => setLeague(League.FTC)}>
                      FTC
                    </button>
                  </div>
                  : !teamConfirmed || !team
                    ? <div>
                        <div className="text-xl">
                          What {league} team are you on?
                        </div>
                        <input type="number" defaultValue={teamNumber?.toString()} className="input input-bordered mt-2" placeholder="Team Number" 
                          onChange={teamNumberChanged} />
                        { team &&
                            <div>
                              <div className="text-lg mt-2">
                                Team <span className="text-accent">{teamNumber}</span> 
                                {" "}- {" "}
                                {team.name 
                                  ? <span className="text-accent">{team.name}</span> 
                                  : <><span className="text-secondary">Unknown Team</span> (you&apos;ll enter your team name on the next screen)</>
                                }. Is that right?
                              </div>
                              <button className="btn btn-primary mt-2" onClick={() => setTeamConfirmed(true)}>
                                Yes, that is the correct team.
                              </button>
                            </div>
                        }
                        <br />
                        <button className="btn btn-ghost mt-3" onClick={() => setLeague(undefined)}>
                          I entered the wrong league.
                        </button>
                      </div>
                    : <div>
                        { (team?.users?.length ?? 0) > 0 ?? false
                          ? <div>
                              { joinRequestStatus === JoinRequestStatus.NotRequested
                                  ? <div>
                                      <div>
                                        Team <span className="text-accent">{team.number}</span> is already registered. 
                                        You&apos;ll need approval to join.
                                      </div> 
                                      <button className="btn btn-primary mt-2" onClick={requestToJoinTeam}>
                                        Request to join team {team.number}, {team.name}
                                      </button>
                                    </div>
                                  : joinRequestStatus === JoinRequestStatus.Requested
                                  ? <div>
                                      Your request to join team {team.number}, {team.name}, has been sent. 
                                      You will be redirected when it&apos;s approved.
                                    </div>
                                  : joinRequestStatus === JoinRequestStatus.CreatedTeam
                                  ? (
                                      !seasonCreated
                                        ? <div>
                                            <div>
                                              Now, we need to create a season. Seasons are used to organize competitions.
                                            </div>
                                            <button className="btn btn-primary mt-2" onClick={createSeason}>
                                              Create season: {game.name} ({game.year})
                                            </button>
                                          </div>
                                        : <div>
                                            <div>
                                              Season created! Now, we just need to create a competition, then you&apos;re done!.<br/>
                                              <br/>
                                              If you have any further questions, don&apos;t hesitate to reach out on{" "}
                                                <a className="link link-hover" href="https://discord.gg/ha7AnqxFDD">Discord</a>.
                                            </div>
                                            <button className="btn btn-primary mt-2" 
                                                onClick={() => completeOnboarding(`/${team.slug}/${season!.slug}/createComp`)}>
                                              Take me to the create competition page
                                            </button>
                                          </div>
                                    )
                                  : <div>
                                      Your request to join team {team.number}, {team.name}, has been rejected. 
                                      Please check with your scouting lead.
                                    </div>
                              }
                            </div>
                          : <div>
                              <div>
                                You&apos;re the first one here from team {teamNumber}, <input className="input input-secondary input-md" placeholder="Enter team name..." value={team.name} onChange={(e) => setTeam({ ...team, name: e.target.value })} />.
                              </div>
                              <button className="btn btn-primary mt-2" onClick={createTeam}>
                                Create team {teamNumber}, {team.name}
                              </button>
                              { errorMsg && <div className="text-error">{errorMsg}</div> }
                            </div>
                        }
                        { joinRequestStatus !== JoinRequestStatus.CreatedTeam &&
                          <button className="btn btn-error mt-3" onClick={() => setTeamConfirmed(false)}>
                            I entered the wrong team number.
                          </button>
                        }
                      </div>
              }
            </div>
            { /* This button is at the bottom*/}
            <button className="btn btn-ghost mt-10" onClick={() => completeOnboarding()}>I know what I&apos;m doing, let me skip onboarding.</button>
          </div>
        </div>
      </div>
    </Container>
  );
}