import Container from "@/components/Container";
import Loading from "@/components/Loading";
import { Team } from "@/lib/Types";
import ClientAPI from "@/lib/client/ClientAPI";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useRouter } from "next/router";
import { ChangeEvent, useState } from "react";

const api = new ClientAPI("gearboxiscool")

export default function Onboarding() {
  const { session, status } = useCurrentSession();
  const router = useRouter();

  const [teamNumber, setTeamNumber] = useState<number | undefined>();
  const [team, setTeam] = useState<Team>();
  const [teamConfirmed, setTeamConfirmed] = useState<boolean>(false);
  const [hasRequestedToJoin, setHasRequestedToJoin] = useState<boolean>(false);
  
  if (session?.user?.onboardingComplete ?? false)
    router.push("/profile");

  async function skipOnboarding() {
    if (!session?.user?._id) return;

    await api.setOnboardingCompleted(session?.user?._id);
    router.push("/profile");
  }

  async function teamNumberChanged(e: ChangeEvent<HTMLInputElement>) {
    const number = parseInt(e.target.value);
    setTeamNumber(number);

    if (number) {
      const team = await api.findTeamByNumber(number);
      setTeam(team);
      setHasRequestedToJoin(team.requests?.includes(session?.user?._id ?? "") ?? false);
    }
  }

  async function requestToJoinTeam() {
    if (!session?.user?._id || !teamNumber) return;

    setHasRequestedToJoin(true);
    await api.requestToJoinTeam(session?.user?._id, team?._id);
  }

  return (
    <Container requireAuthentication={true}>
      { !session?.user && <Loading size={64} /> }
      <div className="w-full flex justify-center p-12">
        <div className="card bg-base-200 w-2/3">
          <div className="card-body flex flex-col justify-between">
            <div> {/* This div is the main content, it's aligned with the top */}
              <div className="card-title gap-0">
                Welcome to<span className="text-accent ml-1">Gearbox</span>, {session?.user?.name}!
              </div>
              <div className="pb-6">
                Before you can start on your scouting journey, there's a bit of set up to do. It will only take a minute.
              </div>
              { !teamConfirmed || !team
                  ? <div>
                      <div className="text-xl">
                        What team are you on?
                      </div>
                      <input type="number" className="input input-bordered mt-2" placeholder="Team Number" 
                        onChange={teamNumberChanged} />
                      { team &&
                          <div>
                            {
                              team.name 
                                ? <div>
                                    <div className="text-lg mt-2">
                                      Team <span className="text-accent">{teamNumber}</span> 
                                      {" "}- <span className="text-secondary">{team.name}</span>. Is that right?
                                    </div>
                                    <button className="btn btn-primary mt-2" onClick={() => setTeamConfirmed(true)}>
                                      Yes, that is the correct team.
                                    </button>
                                  </div>
                                : <div className="text-lg mt-2">
                                    Hmmm. We couldn't find team <span className="text-accent">{teamNumber}</span>. Are you sure that's 
                                    the correct number?
                                  </div>
                            }
                          </div>
                      }
                    </div>
                  : <div>
                      { team.users.length > 0
                        ? <div>
                            { !hasRequestedToJoin 
                                ? <div>
                                    <div>
                                      Team <span className="text-accent">{teamNumber}</span> is already registered. 
                                      You'll need approval to join.
                                    </div> 
                                    <button className="btn btn-primary mt-2" onClick={requestToJoinTeam}>
                                      Request to join team {teamNumber}, {team.name}
                                    </button>
                                  </div>
                                : <div>
                                    Your request to join team {teamNumber}, {team.name}, has been sent. 
                                    The page will update when it's approved.
                                </div>
                            }
                          </div>
                        : <div>
                            You're the first one here.
                          </div>
                      }
                      <button className="btn btn-error mt-3" onClick={() => setTeamConfirmed(false)}>
                        I entered the wrong team number.
                      </button>
                    </div>
              }
            </div>
            { /* This button is at the bottom*/}
            <button className="btn btn-ghost mt-10" onClick={skipOnboarding}>I know what I'm doing, let me skip onboarding.</button>
          </div>
        </div>
      </div>
    </Container>
  );
}