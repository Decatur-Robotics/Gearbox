import { Competition, CompetitonNameIdPair, Team } from "@/lib/Types";
import { useEffect, useState } from "react"
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import ClientAPI from "@/lib/client/ClientAPI";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";

const api = new ClientAPI();

export default function CreateComp(props: ResolvedUrlData) {

    const team = props.team;
    const season = props.season;

    const[name, setName] = useState<string>("");
    const[results, setResults] = useState<{value: number, pair: CompetitonNameIdPair}[]>([]);
    const[selection, setSelection] = useState<number | undefined>();
    const[loading, setLoading] = useState(false);


    const searchComp = async() => {
        if(!name) {return;}
        setLoading(true);
        setSelection(undefined)
        let data = await api.searchCompetitionByName(name);
        setResults(data);
        setLoading(false);
    }


    const createComp = async() => {

      if(selection === undefined) { return; }
      const autofill = await api.getCompetitionAutofillData(results[selection].pair.tbaId);
      console.log(season)
      const comp = await api.createCompetition(autofill.name, autofill.tbaId, autofill.start, autofill.end, season?._id);
      var win: Window = window;
      win.location = `/${team?.slug}/${season?.slug}/${comp.slug}`;
    }


    useEffect(() => {searchComp()}, [name])

    return <Container requireAuthentication={true} hideMenu={false}>
    <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="card w-3/4 bg-base-200 shadow-xl">
          
                <div className="card-body">
                    <h2 className="card-title text-2xl">Create a new Competition</h2>
                    <p>Have a team number? <span className="text-accent">Search By Name</span></p>

                    <input type="text" placeholder="Name" value={name} onChange={(e)=>(setName(e.target.value))} className="input input-bordered input-primary w-full" />
                    
                    <span className="mt-2"></span>
                    {loading ? <span className="loading loading-spinner loading-md"></span>: <></>}
                    
                    <h1 className="text-white text-xl">{results.length > 0 ? "Select a Result" : ""}</h1>
                    {
                      results.map((result, index) => <div key={result.pair.name} className={"rounded-lg bg-base-300 w-full p-2 border-2 " + (index===selection ? "border-accent" : "border-base-300")} onClick={()=>{setSelection(index)}}>
                        <h1 className="text-md">{result.pair.name}</h1>
                      </div>)
                    }

                    <button className="btn btn-primary" disabled={selection === undefined} onClick={createComp}>Create</button>        
                </div>
            </div>  
    </div>     
    </Container>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  }
}