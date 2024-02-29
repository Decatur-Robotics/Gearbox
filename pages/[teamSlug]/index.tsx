import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { Competition, Season, User } from "@/lib/Types";
import { MonthString } from "@/lib/client/FormatTime";
import { validName } from "@/lib/client/InputVerification";
import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Link from "next/link";

const api = new ClientAPI("gearboxiscool");


export default function TeamIndex(props: ResolvedUrlData) {

    const { session, status } = useCurrentSession();
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

    const owner = session?.user?.owner.includes(team?._id ? team?._id: "");

    useEffect(() => {

       
        if(session?.user && !session?.user?.teams.includes(team?._id ? team?._id : "")) {
            location.href = "/";
        }

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
            if(cs.competitions.length > 0) {
                setUpcomingEvent(await api.findCompetitionById(cs?.competitions[cs.competitions.length-1]))
            }
            
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

    }, [session?.user])

    const[selection, setSelection] = useState(1);

    const Overview = () => {
        const seasonUrl = `/${team?.slug}/${currentSeason?.slug}`
        return <div className="card w-5/6 bg-base-200 shadow-xl">
                <div className="card-body">
                    <div className="w-full flex flex-col lg:flex-row">
                        <div className="lg:w-1/2">
                            <h1 className="text-xl mb-2">Upcoming Events:</h1>
                            {upcomingEvent ? <a href={seasonUrl + `/${upcomingEvent.slug}`}><div className="card bg-base-300 border-2 border-base-300 hover:border-accent">

                                <div className="card-body">
                                    <h1 className="card-title text-xl">{upcomingEvent.name}</h1>
                                    <h2 className="ml-3">{MonthString(upcomingEvent.start)}</h2>
                                </div>
                            </div></a> : <p className="text-sm ml-4">No Upcoming Events</p>}
                            
                        </div>
                        
                        <div className="divider lg:divider-horizontal"></div>

                        <div className="lg:w-1/2">
                            <h1 className="text-xl ">Current Season:</h1>
                            <h1 className="text-md mb-2">You can always <a href={`/${team?.slug}/createSeason`} className="text-accent">create a season</a></h1>
                            {currentSeason?.name ? <a href={seasonUrl}><div className="card bg-base-300 border-2 border-base-300 hover:border-accent">

                                <div className="card-body">
                                    <h1 className="card-title text-2xl">{currentSeason.name}</h1>
                                    <h2 className="ml-3">The <span className="text-accent">{currentSeason.year}</span> Season</h2>
                                </div>
                                </div>
                            </a>
                              : <p className="text-sm ml-4">No Seasons</p>}


                            <br></br>
                            <h1 className="text-md">Past Seasons:</h1>
                            
                            <ul className="list-disc">
                                {
                                    pastSeasons?.map((season) =><li key={season.slug} className="ml-4"><Link href={`/${team?.slug}/${season.slug}`} className="text-accent">{season.name} ({season.year})</Link></li>)
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
        setTeam(newTeam);
       
    }

    const deleteUser = async (id:string|undefined, index: number) => {
        if(!team || !id) {return;}
        var newTeam = structuredClone(team)
        var newUsers = [...team.users]
        if(newUsers.indexOf(id) === index) {
            newUsers.splice(index, 1);
        }
        await api.updateTeam({users: newUsers}, team._id)
        newTeam.users = newUsers;
        setTeam(newTeam);

        location.reload();
    }

    const handleRequest = async (userId: string | undefined, accept: boolean) => {
        await api.handleRequest(accept, userId as string, team?._id as string)
        location.reload();
    }

    const Roster = () => {
            return  <div className="card w-5/6 bg-base-200 shadow-xl">
                <div className="card-body">
                    <h1 className="card-title text-2xl">Team Roster</h1>
                    <p>Manage your teams members</p>

                    
                    <h1 className="text-lg">Requests:</h1>
                    {
                        requests.length === 0 ? <p className="text-sm ml-4">No Requests</p> : <></>
                    }

                    
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
                    {
                        requests.map((user) => <div className="card bg-base-300 w-full" key={user._id}>
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
                                    <th>Picture </th>
                                    <th>Name</th>
                                    <th>Owebucks</th>
                                    
                                    <th>Scouter</th>
                                    <th>Manager</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>

                            {
                                users.map((user, index) => <tr key={user._id}>
                                <th>{index+1}</th>
                                <td className="flex flex-row items-center justify-evenly">
                                    <div className="avatar">
                                        <div className="w-10 rounded-full">
                                            <img src={user.image} />
                                        </div>
                                    </div>
                                    
                                </td>
                                <td><div className="pl-2 lg:pl-0" >{user.name}</div></td>
                                <td>{(user.oweBucks > 0)?<div>{user.oweBucks}</div> : <div style={{color:'red'}}>{user.oweBucks}</div>}</td>
                                <td><input type="checkbox" className="toggle toggle-accent" onChange={()=>{updateScouter(user._id as string)}} checked={team?.scouters.includes(user._id as string)}/></td>
                                <td><input type="checkbox" className="toggle toggle-secondary" defaultChecked={owner} disabled/></td>
                                <td><button className="btn btn-outline btn-sm" onClick={() => {deleteUser(user?._id, index)}}>Remove</button></td>
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
    

            
            
            if(numberChange && numberChange <= 0 || Object.keys(await api.findTeamByNumber(numberChange)).length > 0) {
                setSettingsError("Invalid Number");
                return;
            }
    
            await api.updateTeam({name: nameChange, number: numberChange}, team?._id as string);
    
            location.reload()
        }
    
        return  <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
            
                <h2 className="card-title text-3xl">Settings</h2>
                <p className="">Modify and Update Your Teams Information</p>

                <p className="text-error">{settingsError}</p>
                
                <label className="mt-4">Name: </label>
                <input type="text" placeholder="Name" value={nameChange} maxLength={50} onChange={(e) => {setNameChange(e.target.value)}} className="input input-bordered w-full max-w-xs" />

                <label className="mt-2">Number: </label>
                <input type="number" placeholder="Team Number" value={numberChange} min={1} max={9999} onChange={(e) => {setNumberChange(e.target.valueAsNumber)}} className="input input-bordered w-full max-w-xs" />

                <div className="card-actions justify-end">
                    <button className="btn btn-primary normal-case" onClick={updateSettings}>Update</button>
                </div>
        
            </div>     
        </div>
    }

    const OwebucksAdmin = () => {
        const [owebucksToChange, setOwebucksToChange] = useState<number>(20)
        async function changeOweBucks(userId : string | undefined, oweBucks : number | undefined, oweBucksToAdd : number | undefined){
            await api.updateOwebucks(userId, oweBucks, oweBucksToAdd)
        }
        return  <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
                <h1 className="card-title text-2xl">Owebucks</h1>
                <p>Manage your owebucks</p>

                
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
                {
                    requests.map((user) => <div className="card bg-base-300 w-full" key={user._id}>
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
                                <th>Picture </th>
                                <th>Name</th>
                                <th>Owebucks</th>
                                
                                <th>How Many</th>
                                <th>Remove</th>
                                <th>Add</th>
                            </tr>
                        </thead>
                        <tbody>

                        {
                            users.map((user, index) => <tr key={user._id}>
                            <th>{index+1}</th>
                            <td className="flex flex-row items-center justify-evenly">
                                <div className="avatar">
                                    <div className="w-10 rounded-full">
                                        <img src={user.image} />
                                    </div>
                                </div>
                                
                            </td>
                            <td><div className="pl-2 lg:pl-0" >{user.name}</div></td>
                            <td>{user.oweBucks > 0?<div>{user.oweBucks}</div> : <div style={{color:"red"}}>{user.oweBucks}</div>}</td>
                            <td><input type="number" placeholder="Name" value={owebucksToChange} maxLength={50} onChange={(e) => {setOwebucksToChange(e.target.valueAsNumber)}} className="input input-bordered w-full max-w-xs" /></td>
                            <td><button className="btn btn-outline btn-sm" onClick={()=>{changeOweBucks(user._id, user?.oweBucks, (owebucksToChange*-1) )}}>Take</button></td>
                            <td><button className="btn btn-outline btn-sm" onClick={()=>{changeOweBucks(user._id, user?.oweBucks, owebucksToChange )}}>Give</button></td>
                        </tr>)
                        }
                        </tbody>
                    </table>
                </div>
        </div>
    </div>

        
}

    return <Container requireAuthentication={true} hideMenu={false}>
        <div className="w-full h-full flex flex-col justify-center items-center space-y-6 pb-12 lg:pb-0">
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
                    <div className="w-full join grid grid-cols-3">
                        <button className={"join-item btn btn-outline normal-case " + (selection === 1 ? "btn-active": "")} onClick={()=>{setSelection(1)}}>Overview</button>
                        <button className={"join-item btn btn-outline normal-case inline " + (selection === 2 ? "btn-active": "")} onClick={()=>{setSelection(2)}}>Roster {newRequests ? <span className="badge badge-primary inline-block">New </span>: <></>} </button>
                        {session?.user?.owner?.includes(team?._id as string)? <button className={"join-item btn btn-outline normal-case " + (selection === 3 ? "btn-active": "")} onClick={()=>{setSelection(3)}}>Settings</button> : <></>}
                        {(session?.user?.owner?.includes(team?._id as string) && (team!.number == 4026))? <button className={"join-item btn btn-outline normal-case " + (selection === 4 ? "btn-active": "")} onClick={()=>{setSelection(4)}}>Owebucks Admin</button> : <></>}
                        
                    </div>       
                </div>

                {selection === 1 ? <Overview></Overview> : <></>}
                {selection === 2 ? <Roster></Roster> : <></>}
                {selection === 3 ? <Settings></Settings>: <></>}
                {selection === 4 ? <OwebucksAdmin></OwebucksAdmin> : <></>}
        </div>
    </Container>
    

}

export const getServerSideProps: GetServerSideProps = async (context) => { 
    return {
      props: await UrlResolver(context)
    }
}