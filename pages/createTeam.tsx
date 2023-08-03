import { Team } from "@/lib/Types";
import { useEffect, useState } from "react"

import { currentSession } from "@/lib/client/currentSession";

import ClientAPI from "@/lib/client/ClientAPI";

const api = new ClientAPI();

export default function CreateTeam() {

    const { session, status } = currentSession();

    const[teamNumber, setTeamNumber] = useState<number>()
    const[autoData, setAutoData] = useState<Team>();
    const[loading, setLoading] = useState(false);


    const searchTeam = async() => {
        if(!teamNumber) {return;}
        setLoading(true);
        setAutoData(undefined)
        let data = await api.getTeamAutofillData(teamNumber);
        if(data?.name) {
            setAutoData(data)
        }
        setLoading(false);
    }

    const createTeam = async() => {
        if(!autoData || !session?.user) { return; }

        let newTeam = await api.createTeam(autoData.name, autoData.number, session.user._id, autoData.tbaId)

        const win: Window = window;
        win.location = `/${newTeam.slug}`;

    }

    useEffect(() => {searchTeam()}, [teamNumber])

    return <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="card w-3/4 bg-base-200 shadow-xl">
          
                <div className="card-body">
                    <h2 className="card-title text-2xl">Create a new Team</h2>
                    <p>Have a team number? <span className="text-accent">Automatically find your team's details</span></p>

                    <input type="number" placeholder="Team Number" value={teamNumber} onChange={(e)=>(setTeamNumber(e.target.valueAsNumber))} className="input input-bordered input-primary w-full max-w-xs" />
                    
                    <span className="mt-2"></span>
                    {loading ? <span className="loading loading-spinner loading-md"></span>: <></>}
                    {autoData ? <button className="text-lg btn btn-ghost" onClick={createTeam}>{autoData?.name} - <span className="text-accent">#{autoData?.number}</span></button>
                    : <></>}
                </div>

            </div>

            
    </div>

}