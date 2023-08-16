import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import { GetServerSideProps } from "next";
import { MonthString, TimeString } from "@/lib/client/FormatTime";
import { Match, MatchType } from "@/lib/Types";


const api = new ClientAPI();


export default function Home(props: ResolvedUrlData) {
  const team = props.team;
  const season = props.season;
  const comp = props.competition;


  const[allMatches, setAllMatches] = useState<Match[]>([]);
  const[qualMatches, setQualMatches] = useState<Match[]>([]);
  const[semiMatches, setSemiMatches] = useState<Match[]>([]);
  const[finalMatches, setFinalMatches] = useState<Match[]>([]);

  useEffect(() => {
    const loadAutoMatches = async() => {
      const matches: Match[] = [];

      comp?.matches.forEach(async (match) => {
        matches.push(await api.findMatchById(match));
      })
      
      matches.sort((a, b) => {
        if(a.number < b.number) {
          return -1
        } if(a.number > b.number) {
          return 1
        }

        return 0
      })

      setAllMatches(matches);

      matches.forEach((match) => {
        console.log(match.type === MatchType.Qualifying ? "poop": "")
      })
      
      setQualMatches(matches.filter((match) => match.type === MatchType.Qualifying));
      setSemiMatches(matches.filter((match) => match.type === MatchType.Semifinals));    
      setFinalMatches(matches.filter((match) => match.type === MatchType.Finals));
    }
    if(allMatches.length === 0) {
      loadAutoMatches();
    }
      
  }, [])

  if(!comp) {
    return <></>
  }

  return <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
          <div className="card w-5/6 bg-base-200 shadow-xl">
              <div className="card-body min-h-1/2 w-full bg-secondary rounded-t-lg"></div>
              <div className="card-body">
                  <h2 className="card-title text-4xl">{comp.name} - {allMatches.length} - {qualMatches.length} - {semiMatches.length}</h2>
                  <h1 className="text-2xl">{MonthString(comp.start)} - {MonthString(comp.end)}</h1>

                  <div className="card-action space-x-2">
                        {team.tbaId ? <a href={`https://www.thebluealliance.com/event/${comp.tbaId}`}><div className="badge badge-outline link">Linked To TBA</div></a> : <></>}
                        <div className="badge badge-secondary">FIRST FRC</div>
                  </div>
          </div>
        </div>

      {/*
        <div className="card w-5/6 bg-base-200 shadow-xl">
              <div className="card-body">
                  <h2 className="card-title text-4xl">Matches</h2>
                  <h1 className="text-2xl">Generate Matches</h1>

                  <p>Qualifying Matches</p>
                  <div className="overflow-auto max-h-64">
                  {qualMatches.map((match) => <li>Match #{match.number} ({match.type}) - {TimeString(match.time)}</li>)}
                  </div>

                  <div className="divider"></div>

                  <p>Semifinal Matches</p>
                  <ol className="overflow-auto max-h-64">
                  {semiMatches.map((match) => <li>{match.number} ({match.type}) - {TimeString(match.time)}</li>)}
                  </ol>

                  <div className="divider"></div>

                  <p>Final Matches</p>
                  <ol className="overflow-auto max-h-64">
                  {finalMatches.map((match) => <li>{match.number} ({match.type}) - {TimeString(match.time)}</li>)}
                  </ol>
          </div>
        </div>
        */}

        <div className="card w-5/6 bg-base-200 shadow-xl">
              <div className="card-body">
                  <h2 className="card-title text-4xl">Matches</h2>
                  <h1 className="text-2xl">Matches</h1>

                  <div className="max-h-96 overflow-auto">
                    {
                      allMatches.map((match) => <div className="mt-2" key={match._id}>
                        <h1>{match.type} #{match.number}</h1>

                        <h2 className="opacity-50 italic">Approx: {TimeString(match.time)}</h2>
                        <h1><span className="text-info">{match.blueAlliance.join(" ")}</span> vs. <span className="text-error">{match.redAlliance.join(" ")}</span></h1>
                        </div>)
                    }
                  </div>
                  
          </div>
        </div>
</div>
}

export const getServerSideProps: GetServerSideProps = async ({req, res, resolvedUrl}) => {
  return {
    props: await UrlResolver(resolvedUrl),
  }
}