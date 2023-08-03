import UrlResolver from "@/lib/UrlResolver";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import Navbar from "@/components/Navbar";
import Link from "next/link";

const api = new ClientAPI();


export default function Home(props) {
  const team = props.team;
  const season = props.season;
  const comp = props.competition;

  const { data: session, status } = useSession();

  const[matches, setMatches] = useState([])

  useEffect(() => {
    
    async function loadMatches() {
      var newMatches = []
      comp.matches.forEach(async (id) => {
        newMatches.push(await api.findMatchById(id))
      })

      setMatches(newMatches)
    }

    return loadMatches
  }, [comp])

  return <div className="w-full h-screen bg-slate-200">
    <Navbar status={status} user={session?.user}></Navbar>
    <div className="w-full h-5/6 flex flex-col items-center justify-center ml-4">

      <div className="border-2 border-gray-400 rounded-lg w-2/3 h-5/6 bg-slate-300">
        <div className="ml-4 mt-4">
          <h1 className="text-3xl font-bold">{comp.name}</h1>
          <h2 className="text-2xl ">{new Date(comp.start).toLocaleDateString()} - {new Date(comp.end).toLocaleDateString()}</h2>


          <h2 className="text-2xl bold mt-10">Matches: ({matches.length})</h2>
          {
            matches.length !== 0 ? <>{matches.forEach((match) => <Link href={"/"}>Match {match.number}</Link>)}</> : <div>
              
              </div>
          }
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