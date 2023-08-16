import { validEmail, validName } from "@/lib/client/InputVerification";
import {currentSession} from "@/lib/client/currentSession";
import {useEffect, useState} from "react"

import ClientAPI from "@/lib/client/ClientAPI"
import { Team, User } from "@/lib/Types";
import Container from "@/components/Container";
const api = new ClientAPI();

export default function Profile() {
    const { session, status } = currentSession();

    // Top User Card
    const userImageUrl = session?.user?.image || "/user.jpg";

    var teamMember = false;
    var teamOwner = false;
    var admin = false;

    if(session?.user) {
        teamMember = session?.user?.teams.length > 0
        teamOwner = session?.user?.owner.length > 0 
        admin = session?.user?.admin
    }


    // switch between main/settings
    const [showSettings, setShowSettings] = useState(false);

    //main
    
    const Main = () => {

        const[teams, setTeams] = useState<Team[]>([]);
        const[teamNumber, setTeamNumber] = useState<number>();
        const[foundTeam, setFoundTeam] = useState<Team>();
        const[request, setRequest] = useState();

        useEffect(() => {
            
            const loadTeams = async() => {
                var newTeams: Team[] = [];

                session?.user?.teams.forEach(async (id) => {
                    newTeams.push(await api.findTeamById(id));
                })

                setTeams(newTeams);
            }

            if(teams.length === 0) 
                loadTeams()

        }, [session]);

        const findTeam = async() => {
            setFoundTeam(await api.findTeamByNumber(teamNumber))
        }

        const requestTeam = async () => {
            setRequest(await api.teamRequest(session?.user?._id, foundTeam?._id))
            setFoundTeam(undefined);
            setTeamNumber(undefined);
        }

        
        return  <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
            
                <h2 className="card-title text-3xl">Your Teams</h2>
                <p className="">Navigate to your current Team</p>

                <div className="flex flex-col items-center mt-4">
                    <div className="w-full p-4 min-h-max bg-base-300 rounded-lg">
                        {!teamMember ? <p>No Teams - <a href="#join" className="text-accent">Join a Team</a></p> : <></>}

                        {teams.map((team, index) => <a href={`/${team.slug}`}><div className="card w-full bg-base-200 shadow-xl mt-2" key={team._id}>
                            <div className="card-body">
                                <h2 className="card-title text">{team.name} <span className="text-accent">#{team.number}</span></h2>

                                <p className="italic">Recently Updated</p>
                            </div>
                            </div>
                            </a>
                        )}

                    </div>
                </div>
            </div>   

            <div className="divider">OR</div>  

            <div className="card-body" id="join">
            
                <h2 className="card-title text-3xl">Join a Team</h2>
                <p className="">Your Team does not exist? <a href="/createTeam" className="text-accent">Create It!</a></p>

                <div className="flex flex-row items-center mt-4 space-x-2">
                    <input type="number" placeholder="Team Number" value={teamNumber} onChange={(e) => {setTeamNumber(e.target.valueAsNumber)}} className="input input-bordered input-primary w-full max-w-xs" />
                    <button className="btn btn-primary normal-case" onClick={findTeam}>Search</button>
                </div>

                {foundTeam ? <div>
                    <p>Results:</p>
                    <a className="text-accent text-lg"><h1>{foundTeam.name} - {foundTeam.number}</h1></a>
                    <button className="btn btn-secondary normal-case" onClick={requestTeam}>Request to Join</button>
                   
                </div> : <></>}

                {request ? <div className="alert alert-success">
                            <span>Team Request Sent!</span>
                </div>: <></>}
        
            </div>   
        </div>
    }


    // settings
   

    const Settings = () => {

        const [nameChange, setNameChange] = useState(session?.user?.name);
        const [emailChange, setEmailChange] = useState(session?.user?.email);
    
        useEffect(() => {
            setNameChange(session?.user?.name)
            setEmailChange(session?.user?.email)
        }, [session])
    
        const [settingsError, setSettingsError] = useState("")
    
        const updateSettings = async () => {
            setSettingsError("")
            if(!validName(nameChange as string)) {
                setSettingsError("Invalid Name")
                return;
            }
    
            if(!validEmail(emailChange as string)) {
                setSettingsError("Invalid Email");
                return
            }
    
            await api.updateUser({name: nameChange, email: emailChange}, session?.user?._id as string);
    
            location.reload()
        }

        return  <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
            
                <h2 className="card-title text-3xl">Settings</h2>
                <p className="">Modify and Update Your Profile Information</p>

                <p className="text-sm">Login Information is not stored by Gearbox, it is provided by your <span className="text-accent">Sign-In Provider</span></p>

                <p className="text-error">{settingsError}</p>
                
                <label className="mt-4">Name: </label>
                <input type="text" placeholder="Name" value={nameChange} onChange={(e) => {setNameChange(e.target.value)}} className="input input-bordered w-full max-w-xs" />

                <label className="mt-2">Email: </label>
                <input type="email" placeholder="Email" value={emailChange} onChange={(e) => {setEmailChange(e.target.value)}} className="input input-bordered w-full max-w-xs" />

                <div className="card-actions justify-end">
                    <button className="btn btn-primary normal-case" onClick={updateSettings}>Update</button>
                </div>
        
            </div>     
        </div>
    }


    return <Container requireAuthentication={true} hideMenu={false}>
        <div className="min-h-screen flex flex-col items-center justify-center space-y-6 mb-10">
            <div className="card w-5/6 bg-base-200 shadow-xl">
                <div className="card-body min-h-1/2 w-full bg-accent rounded-t-lg"></div>
                <div className="card-body">

                    <div className="avatar">
                        <div className="w-20 rounded-full">
                            <img src={userImageUrl} alt="Profile Picture"/>
                        </div>
                    </div>

                    <h2 className="card-title">{session?.user?.name}</h2>
                    <p className="italic">Known as: {session?.user?.slug}</p>


                    <div className="card-actions justify-start">
                        {teamMember ? <div className="badge badge-neutral">Team Member</div> : <></>}
                        {teamOwner ? <div className="badge badge-primary">Team Owner</div> : <></>}
                        {admin ? <div className="badge badge-secondary">Admin</div> : <></>}
                    </div>
                </div>

                
            </div>     


            <div className="flex flex-row justify-start w-5/6 ">
                <div className="w-1/3 join grid grid-cols-2 ">
                    <button className={"join-item btn btn-outline normal-case" + (!showSettings ? " btn-active": "")} onClick={()=>{setShowSettings(false)}}>Main</button>
                    <button className={"join-item btn btn-outline normal-case" + (showSettings ? " btn-active": "")} onClick={()=>{setShowSettings(true)}}>Settings</button>
                </div>       
            </div>

            
           {!showSettings ? <Main></Main> : <Settings></Settings>}


        </div>
    </Container>

}
