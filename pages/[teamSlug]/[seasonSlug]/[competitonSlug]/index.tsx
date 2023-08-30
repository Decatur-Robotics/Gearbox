import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import { GetServerSideProps } from "next";
import { MonthString, TimeString } from "@/lib/client/FormatTime";
import { Form, Match, MatchType, Report } from "@/lib/Types";
import Container from "@/components/Container";
import { Bs1Circle, BsStarFill } from "react-icons/bs";
import { AiFillWarning, AiOutlineUser } from "react-icons/ai";
import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";


const api = new ClientAPI("gearboxiscool");

export default function Home(props: ResolvedUrlData) {

  const team = props.team;
  const season = props.season;
  const comp = props.competition;


  const { session, status } = useCurrentSession();
  const[selection, setSelection] = useState(1);

  const[loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reports, setReports] = useState<{[id: string]: Report}>({});
  const [qualifyingMatches, setQualifyingMatches] = useState<Match[]>([]);
  const [semiFinalMatches, setSemiFinalMatches] = useState<Match[]>([]);
  const [finalMatches, setFinalMatches] = useState<Match[]>([]);

  const[assigned, setAssigned] = useState(false);

  useEffect(() => {
    const loadMatches = async() => {
      if(!comp) {return;}
      setLoadingMatches(true);
      var newMatches: Match[] = [];
      var newReports: {[id: string]: Report} = {}
      for(const id of comp.matches) {
        const match = await api.findMatchById(id);
        for(const rid of match.reports) {
          const report = await api.findReportById(rid);
          if(!report._id) {continue;}
          newReports[report._id] = report;
        }
        newMatches.push(match);
      }

      newMatches.sort((a, b) => {
        if(a.number < b.number) {
          return -1
        } if(a.number > b.number) {
          return 1
        }

        return 0
      });


      setMatches(newMatches);
      setReports(newReports);
      setAssigned(newMatches[0].reports.length > 0)
      setQualifyingMatches(newMatches.filter((match) => match.type === MatchType.Qualifying));
      setSemiFinalMatches(newMatches.filter((match) => match.type === MatchType.Semifinals));
      setFinalMatches(newMatches.filter((match) => match.type === MatchType.Finals));
      setLoadingMatches(false);
    }

    loadMatches();
  }, [])

  function matchToDisplay(match: Match) {
    const reps: Report[] = match.reports.map((reportId) => reports[reportId]);
    
    const repElements = reps.map((rep) => {
      const isItUs = rep.robotNumber === team?.number;
      const isMe = rep.user === session.user?._id;
      return <Link href={`/${team?.slug}/${season?.slug}/${comp?.slug}/${rep._id}`}><div className={`w-10 h-10 ${rep.color === "Blue" ? "bg-blue-500" : "bg-red-500"} border-2 border-white rounded-lg flex flex-row items-center justify-center`}>{isItUs ? <BsStarFill className="text-yellow-500 text-2xl"></BsStarFill> : <></>} {isMe ? <AiOutlineUser className="text-white text-2xl"></AiOutlineUser> : <></>}</div></Link>
    })

    return <div>
                  <h1>{match.type} - Match {match.number}</h1>
                  <div className="w-full h-12 flex flex-row rounded-lg items-center space-x-2">
                    {repElements}
                  </div>
                  <div className="divider mt-1 mb-1"></div>
          </div>
  }

  function Overview() {
    return <div className="card w-5/6 bg-base-200 shadow-xl">
        <div className="card-body">
            <h2 className="card-title">Matches: </h2>

            {!assigned ? <div className="alert alert-warning mb-10">
              <AiFillWarning/>
              <span>Scouters are not assigned!</span>
            </div> : <></>}

            <div className="w-full flex flex-col items-center ">
              <h1 className="card-title">Qualifying Matches (#{qualifyingMatches.length})</h1>
              {loadingMatches ? <div className="flex flex-col items-center"><span className="loading loading-spinner loading-lg"></span><p className="animate-pulse mt-6 text-xl">Loading... (this will take awhile)</p></div>: <></>}
              {qualifyingMatches.map((match) => matchToDisplay(match))}
            </div>

        </div>
     </div>
  }

  function Settings() {

    const[loadingForms, setLoadingForms] = useState(false);
    const[forms, setForms] = useState<Form[]>([])
    const[selectedForm, setSelectedForm] = useState<string>();
    const[shuffle, setShuffle] = useState(false);
    const[assigning, setAssigning] = useState(false);

    useEffect(() => {
      const loadForms = async () => {
        if(!season) {return;}
        setLoadingForms(true);

        var newForms: Form[] = [];
        for(const id of season.forms) {
          newForms.push(await api.findFormById(id));
        }

        setForms(newForms);
        setSelectedForm(newForms[0]._id)
        setLoadingForms(false);
      }

      loadForms();
    }, []);

    const assignScouters = async () => {
      setAssigning(true);
      const res = await api.assignScouters(team?._id, comp?._id, selectedForm, shuffle );
      setAssigning(false);
    }


    return <div className="card w-5/6 bg-base-200 shadow-xl">
    <div className="card-body">
        <h2 className="card-title text-2xl">Settings: </h2>

        <div className="divider"></div>
        <h1 className="text-xl">Assign Scouters</h1>

        {loadingForms ? <span className="loading loading-spinner loading-md"></span>: <></>}
        
        <h1>Select a Scouting Form</h1>
        <select className="select select-bordered w-full max-w-xs" value={selectedForm} onChange={(e) => {setSelectedForm(e.target.value)}}>
          {forms.map((form) => <option key={form._id} value={form._id}>{form.name}</option>)}
        </select>

        <br></br>
        <h1>Randomize Scouter Order</h1>
        <input type="checkbox" className="checkbox h-8 w-8" checked={shuffle} onChange={(e) => {setShuffle(e.target.checked)}}/>

        <div className="divider"></div>
        {assigning ? <span className="loading loading-spinner loading-md">Loading...</span>: <></>}
        <button className="btn btn-primary" disabled={assigning} onClick={assignScouters}>Assign</button>
    </div>
 </div>
  }

  return <Container requireAuthentication={true} hideMenu={false}>
    <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
      <div className="card w-5/6 bg-base-200 shadow-xl">
        <div className="card-body">
            <h2 className="card-title text-2xl">{comp?.name}</h2>
        </div>
     </div>

     <div className="flex flex-row justify-start w-5/6 ">
        <div className="w-full join grid grid-cols-3">
            <button className={"join-item btn btn-outline normal-case " + (selection === 1 ? "btn-active": "")} onClick={()=>{setSelection(1)}}>Overview</button>
            <button className={"join-item btn btn-outline normal-case " + (selection === 2 ? "btn-active": "")} onClick={()=>{setSelection(2)}}>Settings</button>
        </div>
    </div>

    {selection === 1 ? <Overview></Overview>: <></>}
    {selection === 2 ? <Settings></Settings>: <></>}
    
    </div>
  </Container>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  }
}