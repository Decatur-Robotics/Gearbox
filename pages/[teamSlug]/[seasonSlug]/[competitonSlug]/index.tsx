import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { GetServerSideProps } from "next";
import { AllianceColor, Form, Match, MatchType, Pitreport, Report, User } from "@/lib/Types";
import Container from "@/components/Container";


import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";


import { MdAutoGraph, MdDriveEta, MdInsertPhoto, MdQueryStats } from "react-icons/md";
import { BsClipboard2Check, BsGear, BsGearFill } from "react-icons/bs";
import { FaDatabase, FaEdit, FaUserCheck } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { Round } from "@/lib/client/StatsMath";


const api = new ClientAPI("gearboxiscool");

export default function Home(props: ResolvedUrlData) {
  const team = props.team;
  const season = props.season;
  const comp = props.competition;


  const[matches, setMatches] = useState<Match[]>([]);
  const[qualificationMatches, setQualificationMatches] = useState<Match[]>([]);6
  const[reports, setReports] = useState<Report[]>([]);

  const[reportsById, setReportsById] = useState<{[key: string]: Report}>({});
  const[usersById, setUsersById] = useState<{[key: string]: User}>({});

  //loading states
  const[loadingMatches, setLoadingMatches] = useState(true);
  const[loadingReports, setLoadingReports] = useState(true);
  const[loadingScoutStats, setLoadingScoutStats] = useState(true);
  const[loadingUsers, setLoadingUsers] = useState(true);

  const[submissionRate, setSubmissionRate] = useState(0);
  const[submittedReports, setSubmittedReports] = useState(0);


  const[pitreports, setPitreports] = useState<Pitreport[]>([]);
  
  const[loadingPitreports, setLoadingPitreports] = useState(true);

  useEffect(() => {
    const scoutingStats = (reps: Report[]) => {
      setLoadingScoutStats(true);
      let submittedCount = 0;
      reps.forEach((report) => {
        if(report.submitted) {
          submittedCount++;
        }
      })
      setSubmissionRate(Round(submittedCount/reps.length))
      setSubmittedReports(submittedCount);
      setLoadingScoutStats(false);
    }

    const loadUsers = async() => {
      setLoadingUsers(true)
      
      if(!team?.scouters) {return;}
      const newUsersById: {[key: string]: User} = {}
      for(const userId of team.scouters) {
        newUsersById[userId] = await api.findUserById(userId);
      };
    
      setUsersById(newUsersById);
      setLoadingUsers(false);
    }

    const loadMatches = async () => {
      setLoadingMatches(true)
      const matches: Match[] = await api.allCompetitionMatches(comp?._id);
      matches.sort((a, b) => {
        if (a.number < b.number) {
          return -1;
        }
        if (a.number > b.number) {
          return 1;
        }
        return 0;
      });

      setQualificationMatches(
        matches.filter((match) => match.type === MatchType.Qualifying),
      );

      setMatches(matches);
      setLoadingMatches(false);
    }

    const loadReports = async() => {
      setLoadingReports(true);
      const newReports: Report[] = await api.competitionReports(comp?._id, false);
      setReports(newReports);
      var newReportId: {[key: string]: Report} = {};
      newReports.forEach((report) => {
        if(!report._id) {return;}
        newReportId[report._id] = report;
      })
      setReportsById(newReportId);
      setLoadingReports(false);
      scoutingStats(newReports);
    }

    const loadPitreports = async() => {
      setLoadingPitreports(true);
      if(!comp?.pitReports) {return;}
      const newPitReports: Pitreport[] = []
      for(const pitreportId of comp?.pitReports) {
        newPitReports.push(await api.findPitreportById(pitreportId));
      };
      setPitreports(newPitReports);
      setLoadingPitreports(false);

    }

    loadUsers();
    loadMatches();
    loadReports();
    loadPitreports();
  }, [])

  const { session, status } = useCurrentSession();
  
  return <Container requireAuthentication={true} hideMenu={false}>
      <div className="min-h-screen w-screen flex flex-row grow-0 items-center justify-center  space-x-6 space-y-6 overflow-hidden">
        <div className="w-2/5 flex flex-col grow-0 space-y-4 h-screen ">
          <div className="w-full card bg-base-200 shadow-xl">
            <div className="card-body">
              <h1 className="card-title text-3xl font-bold">{comp?.name}</h1>
              <progress className="progress w-2/3"></progress>
              <div className="w-full flex flex-row items-center mt-4">
                <a className="btn btn-primary" href={"/event/"+comp?.tbaId}>Rankings <MdAutoGraph size={30}/></a>
                <div className="divider divider-horizontal"></div>
                <a className="btn btn-secondary btn-disabled" >Stats <MdQueryStats size={30}/></a>
                <div className="divider divider-horizontal"></div>
                <a className="btn btn-secondary btn-disabled">Driver Reports <MdDriveEta size={30}/></a>
              </div>
            </div>
          </div>
    
          <div className="w-full card bg-base-200 shadow-xl">
            <div className="card-body">
            <h1 className="font-semibold text-lg">Scouting Progress</h1>
            <div className="stats bg-base-300 w-full shadow-xl">
                
                <div className="stat space-y-2">
                  <div className="stat-figure text-accent">
                    <BsClipboard2Check size={65}></BsClipboard2Check>
                  </div>
                  <div className="stat-title text-slate-400">Competition Progress</div>
                  <div className="stat-value text-accent">{30}%</div>
                  <div className="stat-desc">0/71</div>
                </div>

                <div className="stat space-y-2" >
                  <div className="stat-figure text-primary">
                    <FaUserCheck size={65}></FaUserCheck>
                  </div>
                  <div className="stat-title text-slate-400">Scouter Submission</div>
                  {
                    loadingScoutStats ? <div className="stat-value text-primary"><BsGearFill size={45} className="animate-spin-slow"/></div> : <div>
                    <div className="stat-value text-primary">{submissionRate}%</div>
                    <div className="stat-desc">{submittedReports}/{reports.length} Reports</div>
                  </div>}
                </div>
              </div>
              <h1 className="font-semibold text-lg">Pitscouting Progress</h1>
              <div className="stats mt-2">
                  <div className="stat place-items-center">
                    <div className="stat-title">Teams</div>
                    <div className="stat-figure text-primary">
                      <FaUserGroup size={40}></FaUserGroup>
                    </div>
                    <div className="stat-value text-primary">3</div>
                  </div>

                  <div className="stat place-items-center">
                    <div className="stat-figure text-secondary">
                      <MdInsertPhoto size={40}></MdInsertPhoto>
                    </div>
                    <div className="stat-title">Photos</div>
                    <div className="stat-value text-secondary">{30}</div>
                  </div>

                  <div className="stat place-items-center">
                    <div className="stat-figure text-accent">
                      <FaDatabase size={40}></FaDatabase>
                    </div>
                    <div className="stat-title">Datapoints</div>
                    <div className="stat-value text-accent">12.6K</div>
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 flex flex-col grow-0 h-screen space-y-4">
          <div className=" w-full card bg-base-200 shadow-xl ">
            <div className="card-body">
              <h1 className="card-title text-3xl font-bold">{team?.name} - {team?.number}</h1>
              <div className="divider"></div>
              {loadingMatches || loadingReports || loadingUsers ? <div className="w-full flex items-center justify-center"><BsGearFill className="animate-spin-slow" size={75}></BsGearFill></div>:
              <div className="w-full flex flex-col items-center space-y-2">
                <div className="carousel carousel-center max-w-lg h-64 p-4 space-x-4 bg-base-100 rounded-box">
                  {qualificationMatches.map((match) => <div className="carousel-item w-full flex flex-col items-center" key={match._id}>

                    <h1 className="text-lg font-light">Current Match:</h1>
                    <h1 className="text-2xl font-bold mb-4">Match {match.number}</h1>
                    <div className="flex flex-col items-center space-y-4">
                  <div className="w-full flex flex-row items-center space-x-2">
                    {
                      match.reports.map((reportId) => {
                        const report = reportsById[reportId];
                        const submitted = report.submitted;
                        const mine = report.user === session.user?._id;
                        let color = !submitted ? (report.color===AllianceColor.Red?"bg-red-500":"bg-blue-500"): "bg-slate-500";

                        
                        if(!report) return <></>
                        return <Link href={`/${team?.slug}/${season?.slug}/${comp?.slug}/${reportId}`} key={reportId} className={`${color} ${mine && !submitted ? "drop-shadow-glowStrong": ""} rounded-lg w-12 h-12 flex items-center justify-center text-white border-2 border-white`}>
                        <h1>{report.robotNumber}</h1>
                      </Link>
                      })
                    }
                  </div>

                  <div className="w-full flex flex-row items-center space-x-4 ml-2">

                      {match.reports.map((reportId) => {
                        const report = reportsById[reportId];
                        //@ts-ignore
                        const user = usersById[report?.user];
                        
                        return <div className="tooltip tooltip-bottom" data-tip={user?.name} key={reportId}>
                          <div className="avatar online">
                            {/*Ternaries are fun*/}
                            <div className="w-10 rounded-full">
                              <img src={user?.image} onClick={()=>{user.slackId? session.user?.slackId? 
                                api.remindSlack(user.slackId, session.user?.slackId) : console.log("Sender has no valid slackId") 
                                : console.log("Scouter has no slackId")}}/>
                            </div>
                        </div>
                      </div>
                      })}
              
                  </div>
                  </div>
                  </div>)}
                </div>
                <div>
                  <kbd className="kbd">← Scroll →</kbd>
                </div>
                
                
                
              </div>}
            </div>

          </div>

                       
          <div className="w-full card bg-base-200 shadow-xl h-64">
              <div className="card-body grow-0">
                <h1 className="card-title">Pitscouting</h1>
                <div className="overflow-x-scroll flex flex-row space-x-10 h-36">

                {loadingPitreports ? <div className="w-full flex items-center justify-center"><BsGearFill className="animate-spin-slow" size={75}></BsGearFill></div>: 
                    pitreports.map((report) => <div className="avatar mt-2">
                      <div className="relative bg-base-100 rounded-t-lg h-6 z-20 w-16 -translate-y-2 font-bold text-center">{report.teamNumber}</div>
                      <div className="absolute w-24 rounded z-10 translate-y-4 hover:border-4 hover:border-accent">
                        <img src={report.image} />
                      </div>
                    </div>)}
                  
                </div>
              </div>
          </div>
        </div>

       
        

      </div>
    </Container>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  var ctx = await UrlResolver(context);
  return {
    props: ctx,
  };
};
