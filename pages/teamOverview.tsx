
import { Team } from "@/lib/Types"; // Imports the Team type
import { useEffect, useState } from "react" // Imports basic functions from react

import { useCurrentSession } from "@/lib/client/useCurrentSession"; // imports a method for getting the user's current auth

import ClientAPI from "@/lib/client/ClientAPI"; // imports the client-side API
import Container from "@/components/Container"; // imports the container react component (which contains the nav-bar, auth verification, and header)

const api = new ClientAPI("gearboxiscool"); // create an instance of the client-side API, gearboxiscool is the private auth key

export default function TeamOverview() { // declare our react component

    const { session, status } = useCurrentSession(); // fetch your current session

    const[loading,setLoading] = useState(false);
    const[teams,setTeams] = useState<Team[]>([])

    useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
      setLoading(true);
      const teamData: Team[] = await api.allTeams()
      setTeams(teamData)
      setLoading(false)
    }

    return <Container requireAuthentication={true} hideMenu={false}>
      <div className="flex flex-col w-1/2">
      <h1 className="text-5xl font-bold ">Teams in the Database:</h1>
            <div className="divider mb-10"></div>
            {
                teams.map((team, index) => <div className="card bg-base-200 w-1/2" key={index}> 
                    <div className="card-body">
                        <h1 className="text-2xl font-semibold text-accent">{team.name} - {team.number}</h1>
                        <h2 className="text-xl">Participated for {team.seasons.length} seasons</h2>
                        <h2 className="text-md font-bold">{team.users.length} Members</h2>
                    </div>
                </div>)
            }
      </div>
    </Container> // create the barebones web page
}

