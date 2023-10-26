import { Season, Team } from "@/lib/Types"
import { useCurrentSession } from "@/lib/client/useCurrentSession"
import Link from "next/link"
import { ReactNode, useEffect, useState } from "react"
import {BiMenu, BiPlus, BiHome, } from "react-icons/bi"
import {BsGearFill} from "react-icons/bs"
import ClientAPI from "@/lib/client/ClientAPI"


const api = new ClientAPI("gearboxiscool");

type ContainerProps = {
    children: ReactNode
    requireAuthentication: boolean;
    hideMenu: boolean;
}

export default function Container(props: ContainerProps) {


    const { session, status } = useCurrentSession();
    const user = session?.user;
    const authenticated = status === "authenticated";

    const[loadingTeams, setLoadingTeams] = useState<boolean>(false);
    const[teams, setTeams] = useState<Team[]>([]);

    const[selectedTeamIndex, setSelectedTeamIndex] = useState<number>(0);
    const selectedTeam = teams[selectedTeamIndex];
    const[loadingSeasons, setLoadingSeasons] = useState<boolean>(false);
    const[selectedTeamSeasons, setSelectedTeamSeasons] = useState<Season[]>([]);

    useEffect(() => {

        const loadTeams = async() => {

            if(!user) {return;}

            setLoadingTeams(true);
            let newTeams: Team[] = [];
            for(const team of user.teams) {
                newTeams.push(await api.findTeamById(team));
            }
            setTeams(newTeams);

            setLoadingTeams(false);
        }

        loadTeams();

    }, [user]);

    useEffect(() => {
       const loadSelectedSeasons = async() => {
            if(!selectedTeam) {return;}
           setLoadingSeasons(true);

           let newSeasons: Season[] = [];
           for(const season of selectedTeam.seasons) {
             newSeasons.push(await api.findSeasonById(season));
           }

           setSelectedTeamSeasons(newSeasons);
           setLoadingSeasons(false);
       }

       loadSelectedSeasons();
    
    }, [selectedTeamIndex, teams])

    let showAuthBlock = false;
    if(props.requireAuthentication) {
        showAuthBlock = true;
        if(status === "authenticated") {
            showAuthBlock = false;
        }
    }

    
   return <div className="w-full h-screen flex flex-col">
        
        <div className="drawer">
            <input id="menu" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
                
                
                <div className="w-full h-16 bg-base-200 flex flex-row items-center justify-between sticky top-0 z-10">
                    <div className="flex flex-row items-cener justify-center">
                        {authenticated && !props.hideMenu ? <label htmlFor="menu" className="btn btn-ghost drawer-button"><BiMenu className="text-3xl"/></label> : <></> }
                        <Link href={"/"}><h1 className="text-3xl mb-1 btn btn-ghost"><BsGearFill></BsGearFill>Gearbox</h1></Link>
                    </div>

                    <div>
                        {authenticated ?<Link href={"/profile"} tabIndex={0} className="btn btn-ghost btn-circle avatar mr-10">
                            <div className="w-10 rounded-full">
                                <img src={user?.image}/>
                            </div>
                        </Link>: <a href={"/api/auth/signin"}><button className="btn btn-primary mr-4">Sign In</button></a> }
                    </div>
                </div>

                {showAuthBlock ? <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="card w-3/4 lg:w-1/4 bg-base-300 text-primary-content">
                            <div className="card-body">
                                <h2 className="card-title">Wait a minute...</h2>
                                <p>You need to sign in first!</p>
                                <p className="text-sm">If this persists, try reloading</p>
                                <div className="card-actions justify-end">
                                <Link href={"/api/auth/signin/google"}><button className="btn btn-primary">Sign In</button></Link>
                                </div>
                            </div>
                        </div> 
                </div>: props.children}
                
                
            </div> 
            <div className="drawer-side z-20">
                <label htmlFor="menu" className="drawer-overlay"></label>
                <div className="w-64 bg-base-300 h-full">
                    
                    <div className="h-full flex flex-row">

                        <div className="w-1/3 h-full flex flex-col items-center space-y-6 bg-base-100">
                            <h1 className="mt-4 font-semibold">Teams: </h1>

                            {loadingTeams ? <span className="loading loading-spinner loading-lg"></span> : <></> }

                            {teams.map((team, index) => {
                                
                                var initials = team.name.split(" ").map((section) => section.charAt(0));
                                var selected = index === selectedTeamIndex;
                                return <button className={"w-16 h-16 btn btn-ghost " + (selected ? "border-2 border-accent" : "border-2")} key={team._id} onClick={()=>{setSelectedTeamIndex(index)}}>
                                    <h1 className="text-2xl">{initials}</h1>
                                </button>
                            })}

                            <Link className="w-16 h-16 btn btn-primary" href={"/profile"}>
                                <BiPlus className="text-4xl"></BiPlus>
                            </Link>

                        </div>

                        <div className="w-2/3 h-full bg-base-300 flex flex-col items-center">
                            
                            <h1 className="font-semibold text-lg mt-10">{selectedTeam?.name}</h1>
                            
                            <Link href={`/${selectedTeam?.slug}`}>
                                <button className="btn btn-ghost normal-case bg-base-100"><BiHome className="text-2xl"></BiHome>Team Home</button>
                            </Link>

                            <h1 className="mt-10">Seasons:</h1>

                            {loadingSeasons ? <span className="loading loading-spinner loading-lg"></span> : <></> }

                            {selectedTeamSeasons.map((season, index) => {
                                return <Link className="btn btn-ghost w-7/8 bg-base-200 normal-case" href={`/${selectedTeam?.slug}/${season?.slug}`} key={season._id}>
                                    <h1 className="text-sm">{season.name} - {season.year}</h1>
                                </Link>
                            })}
                        </div>

                    </div>
                    
                </div>
            </div>
        </div>

   </div>
}