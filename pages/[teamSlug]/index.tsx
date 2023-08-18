import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { Competition, Season, User } from "@/lib/Types";
import { MonthString } from "@/lib/client/FormatTime";
import { validName } from "@/lib/client/InputVerification";

const api = new ClientAPI();


export default function TeamIndex(props: ResolvedUrlData) {

    const [team, setTeam] = useState(props.team);
    const numberOfMembers = team?.users.length;
    const isFrc = props.team?.tbaId?.includes("frc");
    const currentSeasonId = props.team?.seasons[props.team.seasons.length-1];
    const newRequests = team ? team.requests.length > 0 : undefined;

    const[users, setUsers] = useState<User[]>([]);
    const[requests, setRequests] = useState<User[]>([]);
   
    const[currentSeason, setCurrentSeason] = useState<Season>();
    const[upcomingEvent, setUpcomingEvent] = useState<Competition>();
    const[pastSeasons, setPastSeasons] = useState<Season[]>();


    useEffect(() => {

        const loadUsers = async() => {
            var newData: User[] = []
            team?.users.forEach(async (userId) => {
                newData.push(await api.findUserById(userId))
            })
            setUsers(newData)
        }

        const loadRequests = async() => {
            var newData: User[] = [];
            team?.requests.forEach(async (userId) => {
                newData.push(await api.findUserById(userId));
            })
            setRequests(newData);
        }

        const loadCurrentSeason = async() => {
            if(!currentSeasonId) {return;}
            const cs = await api.findSeasonById(currentSeasonId)
            setCurrentSeason(cs)
            setUpcomingEvent(await api.findCompetitionById(cs?.competitions[cs.competitions.length-1]))
        }

        const loadPastSeasons = async() => {
            var newData: Season[] = [];
            team?.seasons.forEach(async (seasonId) => {
                newData.push(await api.findSeasonById(seasonId));
            })
            setPastSeasons(newData);
        }

        loadUsers();
        loadRequests();
        loadCurrentSeason();
        loadPastSeasons();

    }, [])

    const[selection, setSelection] = useState(1);

    const Overview = () => {
        const seasonUrl = `/${team?.slug}/${currentSeason?.slug}`
        return <div className="card w-5/6 bg-base-200 shadow-xl">
                <div className="card-body">
                    <div className="w-full min-h-1/2 flex flex-row">
                        <div className="w-1/2">
                            <h1 className="text-xl mb-2">Upcoming Events:</h1>
                            {upcomingEvent ? <a href={seasonUrl + `/${upcomingEvent.slug}`}><div className="card bg-base-300 border-2 border-base-300 hover:border-accent">

                                <div className="card-body">
                                    <h1 className="card-title text-xl">{upcomingEvent.name}</h1>
                                    <h2 className="ml-3">{MonthString(upcomingEvent.start)}</h2>
                                </div>
                            </div></a> : <p className="text-sm ml-4">No Upcoming Events</p>}
                            
                        </div>
                        
                        <div className="divider divider-horizontal"></div>

                        <div className="w-1/2">
                            <h1 className="text-xl ">Current Season:</h1>
                            <h1 className="text-md mb-2">You can always <a href={`/${team?.slug}/createSeason`} className="text-accent">create a season</a></h1>
                            {currentSeason ? <a href={seasonUrl}><div className="card bg-base-300 border-2 border-base-300 hover:border-accent">

                                <div className="card-body">
                                    <h1 className="card-title text-2xl">{currentSeason.name}</h1>
                                    <h2 className="ml-3">The <span className="text-accent">{currentSeason.year}</span> Season</h2>
                                </div>
                                </div>
                            </a>
                              : <p className="text-sm ml-4">No Upcoming Events</p>}


                            <br></br>
                            <h1 className="text-md">Past Seasons:</h1>
                            
                            <ul className="list-disc">
                                {
                                    pastSeasons?.map((season) =><li key={season.slug} className="ml-4"><a className="text-accent">{season.name}</a></li>)
                                }

                                {pastSeasons?.length === 0 ? <p>Nothing Here</p>: <></>}
                            </ul>
                        </div>
                        
                    </div>
                </div>
            </div>
    }


    const updateScouter = async (userId: string) => {
        if(!team) {return;}
        var newTeam = structuredClone(team)
        var newArray = [...team.scouters]
        if(!team.scouters.includes(userId)) {
            newArray.push(userId);
        }
        else {
            newArray.splice(newArray.indexOf(userId), 1);
        }

        await api.updateTeam({scouters: newArray}, team._id)
        newTeam.scouters = newArray;
        setTeam(newTeam)
    }

    const handleRequest = async (userId: string | undefined, accept: boolean) => {
        await api.handleRequest(accept, userId as string, team?._id as string)
        location.reload();
    }

    const Roster = () => {
            return  <div className="card w-5/6 bg-base-200 shadow-xl">
                <div className="card-body">
                    <h1 className="card-title text-2xl">Team Roster</h1>
                    <p>Manage your team's members</p>

                    
                    <h1 className="text-lg">Requests:</h1>
                    {
                        requests.length === 0 ? <p className="text-sm ml-4">No Requests</p> : <></>
                    }

                    
                    <div className="grid gap-4 grid-cols-2">
                    {
                        requests.map((user) => <div className="card bg-base-300">
                            <div className="card-body">
                                <div className="flex flex-row space-x-2">
                                    <div className="avatar">
                                        <div className="w-12 rounded-full">
                                            <img src={user.image} />
                                        </div>
                                    </div>

                                    <h1 className="card-title">{user.name}</h1>
                                </div>

                                <div className="card-actions justify-end">
                                    <button className="btn btn-success text-white" onClick={()=>{handleRequest( user._id, true)}}>Add</button>
                                    <button className="btn btn-error text-white" onClick={()=>{handleRequest( user._id, false)}}>Remove</button>
                                </div>

                            </div>
                        </div>)
                    }
                    </div>

                    <div className="divider"></div>

                    <h1 className="text-lg">Members:</h1>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Scouter</th>
                                    <th>Manager</th>
                                </tr>
                            </thead>
                            <tbody>

                            {
                                users.map((user, index) => <tr>
                                <th>{index+1}</th>
                                <td className="flex flex-row items-center justify-evenly">
                                    <div className="avatar">
                                        <div className="w-10 rounded-full">
                                            <img src={user.image} />
                                        </div>
                                    </div>

                                    <div>
                                        {user.name}
                                    </div>   
                                </td>
                                <td><input type="checkbox" className="toggle toggle-accent" onClick={()=>{updateScouter(user._id as string)}} checked={team?.scouters.includes(user._id as string)} /></td>
                                <td><input type="checkbox" className="toggle toggle-secondary" checked={team?.owners.includes(user._id as string)} disabled/></td>
                            </tr>)
                            }
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>

            
    }


   
    const Settings = () => {

        const [nameChange, setNameChange] = useState(team?.name);
        const [numberChange, setNumberChange] = useState(team?.number);
        const [settingsError, setSettingsError] = useState("")
    
    
        const updateSettings = async () => {
            setSettingsError("")
            if(!validName(nameChange as string)) {
                setSettingsError("Invalid Name")
                return;
            }
    
            if(numberChange && numberChange <= 0) {
                setSettingsError("Invalid Number");
                return;
            }
    
            await api.updateTeam({name: nameChange, number: numberChange}, team?._id as string);
    
            location.reload()
        }
    
        return  <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
            
                <h2 className="card-title text-3xl">Settings</h2>
                <p className="">Modify and Update Your Team's Information</p>

                <p className="text-error">{settingsError}</p>
                
                <label className="mt-4">Name: </label>
                <input type="text" placeholder="Name" value={nameChange} onChange={(e) => {setNameChange(e.target.value)}} className="input input-bordered w-full max-w-xs" />

                <label className="mt-2">Number: </label>
                <input type="number" placeholder="Team Number" value={numberChange} onChange={(e) => {setNumberChange(e.target.valueAsNumber)}} className="input input-bordered w-full max-w-xs" />

                <div className="card-actions justify-end">
                    <button className="btn btn-primary normal-case" onClick={updateSettings}>Update</button>
                </div>
        
            </div>     
        </div>
    }

    return <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
            <div className="card w-5/6 bg-base-200 shadow-xl">
                <div className="card-body min-h-1/2 w-full bg-secondary rounded-t-lg"></div>
                <div className="card-body">

                    <h2 className="card-title text-4xl">{team?.name} <span className="text-accent">#{team?.number}</span></h2>
                    <p>{numberOfMembers} Members</p>

                    <div className="card-action space-x-2">
                        {team?.tbaId ? <a href={`https://www.thebluealliance.com/team/${team.number}`}><div className="badge badge-outline link">Linked To TBA</div></a> : <></>}
                        {isFrc ? <div className="badge badge-secondary">FIRST FRC</div> : <></>}
                    </div>
                    
                </div>
            </div>

            <div className="flex flex-row justify-start w-5/6 ">
                <div className="w-3/8 join grid grid-cols-3">
                    <button className={"join-item btn btn-outline normal-case " + (selection === 1 ? "btn-active": "")} onClick={()=>{setSelection(1)}}>Overview</button>
                    <button className={"join-item btn btn-outline normal-case " + (selection === 2 ? "btn-active": "")} onClick={()=>{setSelection(2)}}>Roster {newRequests ? <span className="badge badge-primary">New </span>: <></>} </button>
                    <button className={"join-item btn btn-outline normal-case " + (selection === 3 ? "btn-active": "")} onClick={()=>{setSelection(3)}}>Settings</button>
                </div>       
            </div>

            {selection === 1 ? <Overview></Overview> : <></>}
            {selection === 2 ? <Roster></Roster> : <></>}
            {selection === 3 ? <Settings></Settings>: <></>}
            
    </div>
    

}

export const getServerSideProps: GetServerSideProps = async (context) => { 
    return {
      props: await UrlResolver(context)
    }
}