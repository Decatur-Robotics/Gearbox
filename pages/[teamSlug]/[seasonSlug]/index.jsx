import Navbar from "@/components/Navbar";
import UrlResolver from "@/lib/UrlResolver";
import { useSession} from "next-auth/react";
import Link from "next/link";
import { useState, useEffect  } from "react";
import ClientAPI from "@/lib/client/ClientAPI"

   
const api = new ClientAPI();

export default function Home(props) {
  const team = props.team;
  const season = props.season;

  const { data: session, status } = useSession();

  const[comps, setComps] = useState([])
  useEffect(() => {
    
    async function loadComps() {
      var newComps = comps
      season?.competitions.forEach(async (id, index) => {
        newComps.push(await api.findCompetitionById(id))
      })
      setComps(newComps);
    };
    
    return loadComps
  }, [season])

  return <div className="w-full h-screen bg-slate-200">
    <Navbar status={status} user={session?.user}></Navbar>

    <div className="flex flex-row w-full h-5/6">

      <div className="w-1/4 h-full border-r-4 border-gray-300">
        <div className="m-4">
          <h1 className="text-3xl font-bold">Competitions: </h1>
          <div className="w-full h-full flex flex-col">
            {comps.length} / {season.competitions.length}
            {
              comps.map((comp) => {
                return <Link href={`/${team.slug}/${season.slug}/${comp.slug}`} className="p-1 border-2 rounded-lg">
                  <h1>{comp.name}</h1>
                </Link >
              })
            }
          </div>
        </div>
      </div>

      <div className="w-3/4 h-full">
        <div className="m-8 w-full h-full">
          <h1 className="text-5xl font-bold">{season?.year} Season - {season?.name}</h1>

          <button className="bg-gray-300 p-4 rounded-lg mt-2 opacity-50" disabled>Export Season-wide Data</button>
          
          <div className="w-5/6 flex flex-row h-5/6 mt-4">

            <div className="w-1/2 h-full">
              <h1 className="text-2xl font-semibold">Create and Modify Competitions</h1>
              <Link href={`/${team.slug}/${season?.slug}/createComp`}>
                      <button className="ml-4 mt-4 bg-gray-400 rounded-lg px-4 py-3" >Create a New Competition</button>
              </Link>
            </div>

            <div className="w-1/2 h-full">
              <h1 className="text-2xl font-semibold">Forms</h1>
              <h1>What are Forms</h1>

            </div>

          </div>
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