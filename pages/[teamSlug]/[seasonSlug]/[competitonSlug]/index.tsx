import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

// linked icon, for everything with tbaId!!!!!!!
import ClientAPI from "@/lib/client/ClientAPI"
import { GetServerSideProps } from "next";
import { Form, Match, MatchType, Report, User } from "@/lib/Types";
import Container from "@/components/Container";
import {BsStarFill, BsClipboardCheck, BsCheckCircle, BsQuestionCircle} from "react-icons/bs";

import { AiFillWarning, AiOutlineQuestionCircle, AiOutlineUser } from "react-icons/ai";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton'
import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { Socket } from "socket.io-client";
import { ClientSocket} from "@/lib/client/ClientSocket";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { BiCommentError, BiUser } from "react-icons/bi";
import { useRef } from 'react';

// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)



const api = new ClientAPI("gearboxiscool");
let io: Socket<DefaultEventsMap, DefaultEventsMap>;


export default function Home(props: ResolvedUrlData) {

  function UserNameList(matchID : any){
    const [slackIdList, setSlackIdList] = useState<Array<string | undefined>>([])
    const [userNameList, setUserNameList] = useState<Array<string | undefined>>([])
    const [checkedInList, setCheckedInList] = useState<Array<boolean>>([])
    const [loaded, setLoaded] = useState<Boolean>(false)

    useEffect(()=>{
      async function updateUserNameList(){
        const match = await api.findMatchById(matchID.matchID)
        const reports = match.reports

        for (let i = 0; i < 6; i++) {
          let slackIdsToAdd = slackIdList
          const reportBeingAdded = await api.findReportById(reports[i])
          const userToAdd = await api.findUserById(reportBeingAdded.user)
          if (userToAdd.slackId){
            slackIdsToAdd[i] = userToAdd.slackId
            setSlackIdList(slackIdsToAdd)
          }
          let checkedListToAdd = checkedInList
          checkedListToAdd[i] = reportBeingAdded.checkedIn
          let tempUserNameList = userNameList
          tempUserNameList[i] = userToAdd.name
          setCheckedInList(checkedListToAdd)
          setUserNameList(tempUserNameList)
        }
        setLoaded(true)

      }

      function test(){
        updateUserNameList()
      }
      test()
    })

    return(
      <>
      <details className="dropdown">
        <summary className="w-14 btn btn-primary">Scouts</summary>
          <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52">
            {
              userNameList.map((name, index) => {
                return (
                  <li onClick={(()=>{slackIdList[index]? api.sendSlack(`<@${slackIdList[index]}> Please report to our section and prepare to scout immemdiately`) : api.sendSlack(`@${userNameList[index]} please report to our section and prepare to scout immediately`)})} 
                    style={{color:`${checkedInList[index] ? 'limeGreen': '#cc0000'}`}} key={index}>
                    <a>
                      {loaded ? name : 
                        <div>
                          <span className="loading loading-spinner loading-xs"></span> Loading
                        </div>}
                    </a>
                  </li>
                );
              })
            }
          </ul>
      </details>
      </>
    )
  }

  const team = props.team;
  const season = props.season;
  const comp = props.competition;


  const { session, status } = useCurrentSession();
  const[selection, setSelection] = useState(1);

  const [users, setUsers] = useState<User[]>([])

  const[loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reports, setReports] = useState<{[id: string]: Report}>({});
  const fakeReport = structuredClone(reports)
  const [qualifyingMatches, setQualifyingMatches] = useState<Match[]>([]);
  const [semiFinalMatches, setSemiFinalMatches] = useState<Match[]>([]);
  const [finalMatches, setFinalMatches] = useState<Match[]>([]);
  const[numberSubmitted, setNumberSubmitted] = useState(0)
  const[submissionRate, setSubmissionRate] = useState(0)
  const[missedMatches, setMissedMatches] = useState(0);

  const[showKey, setShowKey] = useState(false);

  const[assigned, setAssigned] = useState(false);

  const[id, setId] = useState('I HATE MY LIFE')

  let rip = useRef(reports)

  useEffect(() => {
    const loadMatches = async() => {
      if(!comp) {return;}
      setLoadingMatches(true);
      var newMatches: Match[] = await api.allCompetitionMatches(comp?._id);
      var newReports: {[id: string]: Report} = {};
      let submissionCounter = 0;
      var allReports = await api.competitionReports(comp?._id, false);
      console.log(allReports.length);
      for(const report of allReports) {
          submissionCounter += report.submitted ? 1 : 0;
          newReports[report._id] = report;
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
      localStorage.setItem("reports",JSON.stringify(newReports))
      setAssigned(newMatches[0]?.reports?.length > 0)
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
      
      setMissedMatches(missed)
    }


    
    loadMatches();

    async function setUpSocket(){

      io = await ClientSocket()

      io.on("connect", ()=>console.log("Connected"))

      io.on("update-checkin", (reportId)=>  {
        console.log("Checking In")
        let reps: any = JSON.parse(localStorage.getItem("reports")!)
        reps[reportId].checkedIn = true
        setReports(reps)
        localStorage.setItem("reports",JSON.stringify(reps))
      })

      io.on("update-checkout", (reportId)=> {
        console.log("Checking out")
        let reps: any = JSON.parse(localStorage.getItem("reports")!)
        reps[reportId].checkedIn = false
        setReports(reps)
        localStorage.setItem("reports",JSON.stringify(reps))
        console.log("Checked out")
        console.log("About to call API")
        async function checkOut(){
          console.log("Calling API")
          await api.updateCheckOut(reportId)
          console.log("Reporting called from in function")
        }
        checkOut()
        console.log("checkOut() ran succefully, checked out")
      })
    }

    setUpSocket()

    
  }, [])

  function matchToDisplay(match: Match) {
    const reps: Report[] = match.reports.map((reportId) => reports[reportId]);

    const repElements = reps.map((rep, index) => {
      const user = rep.user
      const isItUs = rep.robotNumber === team?.number;
      const isMe = rep.user === session.user?._id;
      const submitted = rep.submitted;
      let someoneActive: boolean = rep.checkedIn;

      return (
        <>
       <Link href={`/${team?.slug}/${season?.slug}/${comp?.slug}/${rep._id}`} key={index}>
          <div className={`w-10 h-10 ${submitted ? "bg-gray-500" : (rep.color === "Blue" ? "bg-blue-500" : "bg-red-500")} border-2 border-white rounded-lg flex flex-row items-center justify-center`}>
            {isItUs ? <BsStarFill className="text-yellow-500 text-2xl"></BsStarFill> : <></>}
            {isMe ? <AiOutlineUser className="text-white text-2xl"></AiOutlineUser> : <></>}
            {someoneActive? <BsCheckCircle  className="text-white text-2x1"> </BsCheckCircle> : <></>}
        </div>
      </Link>
      </>)
    })

    return <div>
            <h1>{match.type} - Match {match.number}</h1>
            
            <div className="w-full h-12 flex flex-row rounded-lg items-center space-x-2">
            <UserNameList matchID = {match._id}></UserNameList>
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
        <button onClick={()=>{setId('HAS BEEN SET')}}>CLICK ME</button>
            <h2 className="card-title text-2xl">Matches <button className="btn btn-ghost btn-sm text-xl" onClick={()=>{setShowKey(!showKey)}}><AiOutlineQuestionCircle ></AiOutlineQuestionCircle></button>: </h2>

          

            {!assigned ? <div className="alert alert-warning mb-10">
              <AiFillWarning/>
              <span>Scouters are not assigned!</span>
            </div> : <></>}
            
            <div className="w-full flex flex-col items-center ">

            {showKey ? <div className="mb-10">
              <h1 className="font-bold">Key: </h1>
              <h1><AiOutlineUser className="inline-block text-2xl"></AiOutlineUser> = Match Assigned To You</h1>
              <h1><BsStarFill className="inline-block text-2xl"></BsStarFill> = Your Team</h1>
            </div>:<></>}

              <div className="tabs ">
                <a className={`tab tab-bordered ${tab === 1 ? "tab-active": ""}`} onClick={()=>{setTab(1)}}>Quals</a> 
                <a className={`tab tab-bordered ${tab === 2 ? "tab-active": ""}`} onClick={()=>{setTab(2)}}>Semis</a> 
                <a className={`tab tab-bordered ${tab === 3 ? "tab-active": ""}`} onClick={()=>{setTab(3)}}>Finals</a>
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

    const[matchNumber, setMatchNumber] = useState(0);
    const[matchType, setMatchType] = useState<MatchType>(MatchType.Qualifying);
    const[redAlliance, setRedAlliance] = useState<number[]>([0, 0, 0]);
    const[blueAlliance, setBlueAlliance] = useState<number[]>([0, 0, 0]);


    // ts at its finest :smile:
    const canAssign = team?.scouters ? (team?.scouters.length >= 6 ? true: false) : false;


    const assignScouters = async () => {
      setAssigning(true);
      const res = await api.assignScouters(team?._id, comp?._id, shuffle );
      setAssigning(false);
      location.reload();
    }

    const targetBlueAlliance = (index: number, value: number) => {
      var newAlliance = structuredClone(blueAlliance);
      newAlliance[index] = value;
      setBlueAlliance(newAlliance);
    }

    const targetRedAlliance = (index: number, value: number) => {
      var newAlliance = structuredClone(redAlliance);
      newAlliance[index] = value;
      setRedAlliance(newAlliance);
    }

    const createMatch = async () => {
      await api.createMatch(comp?._id, matchNumber, matchType, blueAlliance, redAlliance);
      location.reload();
    }


    
    return <div className="card w-5/6 bg-base-200 shadow-xl">
    <div className="card-body">
        <h2 className="card-title text-2xl">Settings: </h2>

        <div className="divider"></div>
        <h1 className="text-xl">Assign Scouters</h1>

        <br></br>
        <h1>Randomize Scouter Order</h1>
        <input type="checkbox" className="checkbox h-8 w-8" checked={shuffle} onChange={(e) => {setShuffle(e.target.checked)}}/>

        <div className="divider"></div>
        {assigning ? <span className="loading loading-spinner loading-md">Loading...</span>: <></>}
        {canAssign? <button className="btn btn-primary" disabled={assigning} onClick={assignScouters}>Assign</button>: <button className="btn btn-disabled disabled">More than 6 scouters required</button>}

        <div className="divider"></div>

        <h1 className="font-bold text-xl">Manually Add a Match</h1>

        <label>Match Number: </label>
        <input type="number" placeholder="Team Number" value={matchNumber} onChange={(e)=>(setMatchNumber(e.target.valueAsNumber))} className="input input-bordered input-primary w-full max-w-xs" />

        <p>Match Type</p>
        {/* @ts-ignore*/}
        <select className="select select-bordered w-full max-w-xs" value={matchType} onChange={(e) => {setMatchType((e.target.value))}}>
          <option value={MatchType.Qualifying}>Qualifying</option>
          <option value={MatchType.Semifinals}>Semifinals</option>
          <option value={MatchType.Finals}>Finals</option>
        </select>

        <div className="divider"></div>

        <p>Red Alliance</p>
        <label>Team 1</label>
        <input type="number" placeholder="Red Alliance 1" value={redAlliance[0]} onChange={(e)=>{targetRedAlliance(0, e.target.valueAsNumber)}} className="input input-bordered input-primary w-full max-w-xs" />
        <label>Team 2</label>
        <input type="number" placeholder="Red Alliance 2" value={redAlliance[1]} onChange={(e)=>{targetRedAlliance(1, e.target.valueAsNumber)}} className="input input-bordered input-primary w-full max-w-xs" />
        <label>Team 3</label>
        <input type="number" placeholder="Red Alliance 3" value={redAlliance[2]} onChange={(e)=>{targetRedAlliance(2, e.target.valueAsNumber)}} className="input input-bordered input-primary w-full max-w-xs" />

        <div className="divider"></div>

        <p>Blue Alliance</p>
        <label>Team 1</label>
        <input type="number" placeholder="Blue Alliance 1" value={blueAlliance[0]} onChange={(e)=>{targetBlueAlliance(0, e.target.valueAsNumber)}} className="input input-bordered input-primary w-full max-w-xs" />
        <label>Team 2</label>
        <input type="number" placeholder="Blue Alliance 2" value={blueAlliance[1]} onChange={(e)=>{targetBlueAlliance(1, e.target.valueAsNumber)}} className="input input-bordered input-primary w-full max-w-xs" />
        <label>Team 3</label>
        <input type="number" placeholder="Blue Alliance 3" value={blueAlliance[2]} onChange={(e)=>{targetBlueAlliance(2, e.target.valueAsNumber)}} className="input input-bordered input-primary w-full max-w-xs" />

        <p className="italic">Note: Manually Creating a Match Requires Eventual Scouter Reassignment</p>
        <button className="btn btn-primary" onClick={createMatch}>Create</button>

    </div>
 </div>
  }

  return <Container requireAuthentication={true} hideMenu={false}>
    <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
      <div className="card w-5/6 bg-base-200 shadow-xl">
        <div className="card-body">
            <h2 className="card-title text-2xl font-bold">{comp?.name}</h2>
            <Link href={`/${team?.slug}/${season?.slug}/${comp?.slug}/stats`}><button className="btn btn-outline">View Stats</button></Link>
            <div className="divider"></div>
            
            <div className="stats bg-base-300 stats-vertical lg:stats-horizontal lg:w-1/2">
              <div className="stat ">
              <div className="stat-figure text-accent text-6xl">
                {loadingMatches ? <span className="loading loading-spinner loading-lg"></span>: <BsClipboardCheck></BsClipboardCheck>}
                </div>
                <div className="stat-title">Overall Submission</div>
                  {/*@ts-ignore --- lol!!*/}
                  <div className="stat-value m-2 text-xl"><div className="radial-progress " style={{"--value":submissionRate}}>{submissionRate * 100}%</div></div>
                <div className="stat-desc">{Object.keys(reports).length-numberSubmitted} Matches Remaining</div>
              </div>
              
              <div className="stat">
                <div className="stat-figure text-accent text-6xl">
                {loadingMatches ? <span className="loading loading-spinner loading-lg"></span>: <BiCommentError></BiCommentError>}
                </div>
                <div className="stat-title">Missing Matches</div>
                <div className="stat-value">{missedMatches}</div>
                <div className="stat-desc">{(Math.round((missedMatches/Object.keys(reports).length)*100)/100) * 100}% of total matches</div>
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
  var ctx = await UrlResolver(context);
  return {
    props: ctx,
  }
}
