import { Season } from "../../lib/Types"
import ClientAPI from "../../lib/client/ClientAPI"
import { useState } from "react";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";

const api = new ClientAPI();

export const CurrentSeason = new Season("Charged Up", undefined, 2023);

export default function Home(props: ResolvedUrlData) {

    const team = props.team;

    const[year, setYear] = useState(CurrentSeason.year);
    const[name, setName] = useState(CurrentSeason.name);

    const createSeason = async(season: {name: string, year: number}) => {
        const s = await api.createSeason(season.name, season.year, team._id as string);
        const win: Window = window;
        win.location = `/${team.slug}/${s.slug}`;
    }
    
    return <Container requireAuthentication={true} hideMenu={false}>
    <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="card w-5/6 bg-base-200 shadow-xl">
    
            <div className="card-body flex flex-col items-center">
                <h2 className="card-title text-3xl">Create a new Season</h2>
                <div className="card w-full bg-base-100 shadow-xl">
                    <figure>
                        <img src={"https://www.mouser.de/images/mktg/first/first-landing-chargedup-logo-well-600x500px.jpg"} alt="Season Logo" />
                    </figure>
                    <div className="card-body">
                        <h2 className="card-title text-2xl">{CurrentSeason.name}</h2>
                        <p className="text-xl">FIRST Robotics <span className="text-accent">{CurrentSeason.year} Season</span></p>
                        <div className="card-actions justify-end">
                        <button className="btn btn-primary normal-case" onClick={()=>{createSeason(CurrentSeason)}}>Create</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
    </Container>
}


export const getServerSideProps: GetServerSideProps = async ({req, res, resolvedUrl}) => {
    return {
      props: await UrlResolver(resolvedUrl),
    }
}