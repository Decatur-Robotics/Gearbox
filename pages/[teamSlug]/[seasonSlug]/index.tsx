import ClientAPI from "@/lib/client/ClientAPI"
import { useEffect, useState } from "react";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { Competition, Form } from "@/lib/Types";
import { MonthString } from "@/lib/client/FormatTime";

const api = new ClientAPI();

export default function Home(props: ResolvedUrlData) {

    const team = props.team;
    const season = props.season;

    const[selection, setSelection] = useState(1)

    const[forms, setForms] = useState<Form[]>([]);
    const[comps, setComps] = useState<Competition[]>([]);

    useEffect(() => {
       const loadForms = async () => {
        var newForms: Form[] = []
        season?.forms.forEach(async (id) => {
          newForms.push(await api.findFormById(id));
        })
        setForms(newForms)
       }

       const loadComps = async () => {
        var newComps: Competition[] = []
        season?.competitions.forEach(async (id) => {
          newComps.push(await api.findCompetitionById(id));
        })
        setComps(newComps)
       }

       loadForms();
       loadComps();
    }, [])


    const Forms = () => {

      return <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-2xl">Forms</h2>
                <h1 className="text-xl">Manage and Edit Your Scouter's Forms</h1>

                <h3>No Forms? <a className="text-accent" href={`/${team.slug}/${season?.slug}/formEditor`}>Create a new one</a></h3>
                <div className="divider"></div>
                {
                  forms.map((form) => <div className="card w-5/6 bg-base-300" key={form._id}>
                    <div className="card-body">
                      
                      <h1 className="card-title">{form.name}</h1>

                      <h2>{form.data.length} Question(s)</h2>

                      <div className="card-actions justify-end">
                          <a href={`/${team.slug}/${season?.slug}/formEditor?id=${form._id}`}><button className="btn btn-info normal-case">Edit</button></a>
                          <button className="btn btn-error normal-case" disabled>Delete</button>
                      </div>
                    </div>
                  </div>)
                }
            </div>
      </div>
    }

    const Overview = () => {
      return <div className="card w-5/6 bg-base-200 shadow-xl">
      <div className="card-body">
          <h2 className="card-title text-2xl">Overview</h2>
          <h1 className="text-xl">See your upcoming competitions</h1>

          <h3>No Competitions? <a className="text-accent" href={`/${team.slug}/${season?.slug}/createComp`}>Create a new one</a></h3>
          <div className="divider"></div>
          {
            comps.map((comp) => <a href={`/${team.slug}/${season?.slug}/${comp.slug}`}><div className="card w-5/6 bg-base-300" key={comp._id}>
              <div className="card-body">
                
                <h1 className="card-title">{comp.name}</h1>

                <h1>{MonthString(comp.start)} - {MonthString(comp.end)}</h1>
              </div>
            </div>
            </a>)
          }
      </div>
</div>
    }
  
    return <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
          <div className="card w-5/6 bg-base-200 shadow-xl">
              <div className="card-body min-h-1/2 w-full bg-primary rounded-t-lg"></div>
              <div className="card-body">
                  <h2 className="card-title text-4xl">{season?.name} </h2>
                  <h1 className="text-2xl">The <span className="text-accent">{season?.year}</span>  Season</h1>

                  <div className="card-action space-x-2">
                        {team.tbaId ? <a href={`https://www.thebluealliance.com/team/${team.number}`}><div className="badge badge-outline link">Linked To TBA</div></a> : <></>}
                        <div className="badge badge-secondary">FIRST FRC</div>
                  </div>
          </div>
    </div>

    <div className="flex flex-row justify-start w-5/6 ">
        <div className="w-3/8 join grid grid-cols-3">
            <button className={"join-item btn btn-outline normal-case " + (selection === 1 ? "btn-active": "")} onClick={()=>{setSelection(1)}}>Overview</button>
            <button className={"join-item btn btn-outline normal-case " + (selection === 2 ? "btn-active": "")} onClick={()=>{setSelection(2)}}>Forms</button>
            <button className={"join-item btn btn-outline normal-case " + (selection === 3 ? "btn-active": "")} onClick={()=>{setSelection(3)}} disabled>Season-Wide Stats</button>
        </div>
    </div>

    {selection === 1 ? <Overview></Overview>: <></>}
    {selection === 2 ? <Forms></Forms>: <></>}
    {selection === 3 ? <></>:<></>}
</div>
}


export const getServerSideProps: GetServerSideProps = async ({req, res, resolvedUrl}) => {
    return {
      props: await UrlResolver(resolvedUrl),
    }
}



