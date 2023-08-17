import { Team } from "@/lib/Types";
import { useEffect, useState } from "react"

import { currentSession } from "@/lib/client/currentSession";

import ClientAPI from "@/lib/client/ClientAPI";
import Container from "@/components/Container";

const api = new ClientAPI();

export default function CreateTeam() {

    const { session, status } = currentSession();

    const[teamNumber, setTeamNumber] = useState<number>()
    const[autoData, setAutoData] = useState<Team>();
    const[loading, setLoading] = useState(false);
    const[error, setError] = useState("");
    const[wait, setWait] = useState<NodeJS.Timeout | undefined>();


    const searchTeam = async() => {
        if(!teamNumber) {return;}
       
        setAutoData(undefined)
        let data = await api.getTeamAutofillData(teamNumber);
        if(data?.name) {
            setAutoData(data)
        }
        setLoading(false);
    }

    const createTeam = async() => {
        if(!autoData || !session?.user) { return; }

        
        if(Object.keys(await api.findTeamByNumber(teamNumber)).length > 0) {
            setError("This Team Already Exists");
            return
        }

        let newTeam = await api.createTeam(autoData.name, autoData.number, session.user._id, autoData.tbaId)

        const win: Window = window;
        win.location = `/${newTeam.slug}`;

    }

    useEffect(() => {
        
        if(wait) {
            setLoading(true);
            clearTimeout(wait);
            setWait(undefined);
        }
        setWait(setTimeout(searchTeam, 1000));
    }, [teamNumber])

    ///*** query and prevent dups! */

    return <Container requireAuthentication={true} hideMenu={false}>
    <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="card w-3/4 bg-base-200 shadow-xl">
          
                <div className="card-body">
                    <h2 className="card-title text-2xl">Create a new Team</h2>
                    <p>Have a team number? <span className="text-accent">Automatically find your team's details</span></p>
                    <p className="text-error">{error}</p>

                    <input type="number" placeholder="Team Number" value={teamNumber} onChange={(e)=>(setTeamNumber(e.target.valueAsNumber))} className="input input-bordered input-primary w-full max-w-xs" />
                    
                    <span className="mt-2"></span>
                    {loading ? <span className="loading loading-spinner loading-md"></span>: <></>}
                    {autoData ? <button className="text-lg btn btn-ghost h-fit bg-base-300" onClick={createTeam}>{autoData?.name} - <span className="text-accent">#{autoData?.number}</span></button>
                    : <></>}
                </div>

            </div>

    </div>
    </Container>

}