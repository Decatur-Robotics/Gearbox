import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import { GetServerSideProps } from "next";

import { Form, Match, MatchType, Report } from "@/lib/Types";
import Container from "@/components/Container";
import {BsStarFill, BsClipboardCheck } from "react-icons/bs";
import { AiFillWarning, AiOutlineUser } from "react-icons/ai";
import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { BiCommentError, BiUser } from "react-icons/bi";
import { collectAppConfig } from "next/dist/build/utils";


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

  const[numberSubmitted, setNumberSubmitted] = useState(0)
  const[submissionRate, setSubmissionRate] = useState(0)
  const[reliability, setReliability] = useState(0);
  const[missedMatches, setMissedMatches] = useState(0);

  const[assigned, setAssigned] = useState(false);

  useEffect(() => {
    const loadMatches = async() => {
      if(!comp) {return;}
      setLoadingMatches(true);
      var newMatches: Match[] = [];
      var newReports: {[id: string]: Report} = {};
      let submissionCounter = 0
      for(const id of comp.matches) {
        const match = await api.findMatchById(id);
        for(const rid of match.reports) {
          const report = await api.findReportById(rid);
          if(!report._id) {continue;}
          submissionCounter += report.submitted ? 1 : 0;
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
      setNumberSubmitted(submissionCounter)
      setSubmissionRate(Math.round((submissionCounter/Object.keys(newReports).length)*100)/100)

      let missed = 0;
      let mine = 0;
      let mineDone = 0;
      newMatches.forEach((match) => {
        let numSubmitted = 0
        match.reports.forEach((report) => {
          if(newReports[report].submitted) {
            numSubmitted++;
          }

          if(newReports[report].user === session?.user?._id) {
            mine++;
            if(newReports[report].submitted) {
              mineDone++;
            }
          }
        });

        if(numSubmitted > 0) {
          missed += (6-numSubmitted);
        }
      });
      

      setReliability(Math.round((mineDone/mine)*100)/100)
      setMissedMatches(missed)
    }

    loadMatches();
  }, [])

  function matchToDisplay(match: Match) {
    const reps: Report[] = match.reports.map((reportId) => reports[reportId]);

    const repElements = reps.map((rep) => {
      const isItUs = rep.robotNumber === team?.number;
      const isMe = rep.user === session.user?._id;
      const submitted = rep.submitted;
      return <Link href={`/${team?.slug}/${season?.slug}/${comp?.slug}/${rep._id}`}><div className={`w-10 h-10 ${submitted ? "bg-gray-500" : (rep.color === "Blue" ? "bg-blue-500" : "bg-red-500")} border-2 border-white rounded-lg flex flex-row items-center justify-center`}>{isItUs ? <BsStarFill className="text-yellow-500 text-2xl"></BsStarFill> : <></>} {isMe ? <AiOutlineUser className="text-white text-2xl"></AiOutlineUser> : <></>}</div></Link>
    })

    return <div>
            <h1>{match.type} - Match {match.number}</h1>
            <div className="w-full h-12 flex flex-row rounded-lg items-center space-x-2">
              {reps.length > 0 ? repElements : <h1>No Information Available</h1>}
            </div>
            <div className="divider mt-1 mb-1"></div>
    </div>
  }

  function Overview() {

    const[tab, setTab] = useState(1);

    const matches = tab === 1 ? qualifyingMatches : (tab === 2 ? semiFinalMatches : finalMatches);
    const name = tab === 1 ? "Qualifiers" : (tab === 2 ? "Semifinals" : "Finals");

    return <div className="card w-5/6 bg-base-200 shadow-xl">
        <div className="card-body">
            <h2 className="card-title text-2xl">Matches: </h2>

            {!assigned ? <div className="alert alert-warning mb-10">
              <AiFillWarning/>
              <span>Scouters are not assigned!</span>
            </div> : <></>}
            
            <div className="w-full flex flex-col items-center ">

              <div className="tabs">
                <a className={`tab tab-bordered ${tab === 1 ? "tab-active": ""}`} onClick={()=>{setTab(1)}}>Qualifying</a> 
                <a className={`tab tab-bordered ${tab === 2 ? "tab-active": ""}`} onClick={()=>{setTab(2)}}>Semifinal</a> 
                <a className={`tab tab-bordered ${tab === 3 ? "tab-active": ""}`} onClick={()=>{setTab(3)}}>Final</a>
              </div>

              <h1 className="card-title mt-6">{name} ({matches.length})</h1>
                {loadingMatches ? <div className="flex flex-col items-center"><span className="loading loading-spinner loading-lg"></span><p className="animate-pulse mt-6 text-xl">Loading... (this will take awhile)</p></div>: <></>}
                {matches.map((match) => matchToDisplay(match))}
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
      location.reload();
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
            <h2 className="card-title text-2xl font-bold">{comp?.name}</h2>
            <div className="divider"></div>

            <div className="stats bg-base-300 stats-vertical lg:stats-horizontal lg:w-1/2">
              <div className="stat ">
              <div className="stat-figure text-accent text-6xl">
                  <BsClipboardCheck></BsClipboardCheck>
                </div>
                <div className="stat-title">Overall Submission</div>
                  {/*@ts-ignore --- lol!!*/}
                  <div className="stat-value m-2 text-xl"><div className="radial-progress " style={{"--value":submissionRate}}>{submissionRate }%</div></div>
                <div className="stat-desc">{Object.keys(reports).length-numberSubmitted} Matches Remaining</div>
              </div>
              
              <div className="stat">
                <div className="stat-figure text-accent text-6xl">
                  <BiCommentError></BiCommentError>
                </div>
                <div className="stat-title">Missing Matches</div>
                <div className="stat-value">{missedMatches}</div>
                <div className="stat-desc">{(Math.round((missedMatches/Object.keys(reports).length)*100)/100) * 100}% of total matches</div>
              </div>
              
            </div>

            <div className="stats bg-base-300 stats-vertical lg:stats-horizontal lg:w-1/2">
              <div className="stat">
                <div className="stat-figure text-accent text-6xl">
                  <BiUser></BiUser>
                </div>
                <div className="stat-title">Your Reliability</div>
                <div className={`stat-value ${reliability < .5 ? "text-warning": "text-success"}`}>{reliability}</div>
                <div className="stat-desc">{reliability < .8 ? "Continue scouting": "Awesome Job"}</div>
              </div>
              
            </div>
        </div>
     </div>

     <div className="flex flex-row justify-start w-5/6">
        <div className="w-full join grid grid-cols-2">
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