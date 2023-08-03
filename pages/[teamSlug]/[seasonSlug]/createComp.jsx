
import { useState } from "react";
import ClientAPI from "../../../lib/client/ClientAPI"
import { useSession } from "next-auth/react";
import UrlResolver from "@/lib/UrlResolver";
import Navbar from "../../../components/Navbar"

const api = new ClientAPI();

// IDEA: the blue alliance provides sometimes the comps for a team... we could automatically provide that for easy selection

export default function Home(props) {


  const team = props.team
  const season = props.season
  const { data: session, status } = useSession();

  const[id, setId] = useState("");
  const [autoCompData, setAutoCompData] = useState(null);
  const autoData = async() => {
    setAutoCompData(await api.getCompetitionAutofillData(id));
  }

  const[name, setName] = useState("");
  const[start, setStart] = useState(Date.now());
  const[end, setEnd] = useState(Date.now());


  const createComp = async(data) => {
    var comp = await api.createCompetition(data.name, data.tbaId, data.start, data.end, season._id);
    window.location = `/${team.slug}/${season.slug}/${comp.slug}`;
  }

  return <div className="w-full h-screen bg-slate-200">
    <Navbar status={status} user={session?.user}></Navbar>

    <div className="w-full h-5/6 flex flex-col ml-4">
            <h1 className="font-bold text-5xl m-4">Create A Competition</h1>

            <div className="m-4">
                <div className="p-2 border-2 border-gray-400 rounded-lg w-1/2">
                    <h1 className="font-bold text-3xl mt-4 ml-4">Provide a Blue Alliance ID: </h1>
                    <h1 className="font-bold text-lg ml-6 text-gray-400 italic">Competiton data can automatically be found</h1>
                
                    <input type="text" placeholder="Comp Id" value={id} onChange={(e)=> {setId(e.target.value)}} className="ml-8 p-2 text-xl border-2 border-gray-400 rounded-lg"></input>
                    <button className="ml-4 bg-gray-400 rounded-lg px-4 py-3" onClick={autoData}>Search</button>

                    {
                        autoCompData ? <div className="ml-8 p-2 border-2 border-gray-400 rounded-lg w-fit">
                            <h1>Is this correct?</h1>
                            {autoCompData.name}
                            {autoCompData.start}

                            <button className="ml-4 bg-gray-300 rounded-lg px-4 py-3" onClick={()=>createComp(autoCompData)}>Use this Data</button>
                        </div> : <></>
                    }

                </div>

                <div className="p-2 border-2 border-gray-400 rounded-lg w-1/2">
                    <h1 className="font-bold text-3xl mt-4 ml-4">Manually Provide Data: </h1>
                
                    <input type="text" placeholder="Competition Name" value={name} onChange={(e)=> {setName(e.target.value)}} className="ml-8 p-2 text-xl border-2 border-gray-400 rounded-lg"></input>

                    <p>Competiton Start: </p>
                    <input type="date" placeholder="Competition Name" value={start} onChange={(e)=> {setStart(e.target.value)}} className="ml-8 p-2 text-xl border-2 border-gray-400 rounded-lg"></input>
                    <p>Competiton End: </p>
                    <input type="date" placeholder="Competition Name" value={end} onChange={(e)=> {setEnd(e.target.value)}} className="ml-8 p-2 text-xl border-2 border-gray-400 rounded-lg"></input>
                   

                    {Date.parse(start)}
                    <button className="ml-4 bg-gray-300 rounded-lg px-4 py-3" onClick={()=>createComp({name: name, start: Date.parse(start), end: Date.parse(end)})}>Use this Data</button>

                </div>

            </div>
      </div>
  
  </div>
}

export const getServerSideProps = async ({req, res, resolvedUrl}) => {
  return {
    props: await UrlResolver(resolvedUrl),
  }
}