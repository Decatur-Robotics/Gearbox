import { League, Team } from "@/lib/Types";
import { useEffect, useState } from "react";

import { useCurrentSession } from "@/lib/client/hooks/useCurrentSession";

import ClientAPI from "@/lib/client/ClientAPI";
import Container from "@/components/Container";
import Card from "@/components/Card";
import Flex from "@/components/Flex";
import Loading from "@/components/Loading";
import TeamCard from "@/components/TeamCard";
import { TheOrangeAlliance } from "@/lib/TheOrangeAlliance";
import { Analytics } from "@/lib/client/Analytics";
import { useRouter } from "next/router";
import { useParams } from "next/navigation";
import { search } from "slack";

const api = new ClientAPI("gearboxiscool");

export default function CreateTeam() {
  const router = useRouter();

  const { session, status } = useCurrentSession();

  const [team, setTeam] = useState<Partial<Team>>({
  });

  useEffect(() => {
    setTeam({ 
      ...team, 
      league: router.query.league ? router.query.league as League : undefined, 
      number: router.query.number ? +router.query.number : undefined 
    });
  }, [router.query]);

  const [error, setError] = useState("");

  const createTeam = async () => {
    if (!session?.user) {
      return;
    }

    if (!team?.league) {
      setError("Must select a league");
      return;
    }

    if (!team?.number) {
      setError("Must enter a team number");
      return;
    }

    if (!team?.name) {
      setError("Must enter a team name");
      return;
    }

    const findResult = await api.findTeamByNumberAndLeague(Number(team?.number), team.league);
    console.log(findResult);
    if (findResult._id) {
      setError("This Team Already Exists");
      return;
    }

    const newTeam = await api.createTeam(
      team.name,
      team.number,
      session.user._id,
      team.number.toString(),
      team.league
    );

    Analytics.teamCreated(team.number, team.league, session?.user?.name ?? "Unknown User");

    const win: Window = window;
    win.location = `/${newTeam.slug}`;
  };

  useEffect(() => {
    api.getTeamAutofillData(team.number, team.league ?? League.FRC)
      .catch(() => null)
      .then((data) => {
        if (data)
          setTeam({ ...team, name: data.name });
        setError("");
      });
  }, [team.number, team.league]);

  return (
    <Container requireAuthentication={true} hideMenu={false} title="Create Team">
      <Flex
        mode="col"
        className="md:h-full items-center md:justify-center max-sm:py-10"
      >
        <Card title="Create a Team">
          <div className="flex flex-row space-x-4 flex-g">
            {
              Object.values(League).map((league) => (
                <button
                  key={league}
                  className={`w-1/2 btn bg-base-300 border-accent ${team.league === league && " border-4"}`}
                  onClick={() => setTeam({ ...team, league })}
                >
                  {league}
                </button>
              ))
            }
          </div>
          {/* Use value={team.number ?? ""} to start the input as controlled while still showing the placeholder -Renato */}
          <input type="number" placeholder="Team Number" className="input w-full" value={team.number ?? ""} 
            onChange={(e) => setTeam({...team, number: +e.target.value > 0 ? +e.target.value : undefined})} />
          <input type="text" placeholder="Team Name" className="input w-full" value={team.name ?? ""} 
            onChange={(e) => setTeam({...team, name: e.target.value})} />
          <button className="btn btn-primary w-full" onClick={createTeam}>Create Team</button>
          {error && <p className="text-red-500">{error}</p>}
        </Card>
      </Flex>
    </Container>
  );
}