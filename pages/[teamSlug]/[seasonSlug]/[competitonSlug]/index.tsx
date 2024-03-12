import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";

import ClientAPI from "@/lib/client/ClientAPI";
import { GetServerSideProps } from "next";
import { AllianceColor, Form, Match, MatchType, Report, User } from "@/lib/Types";
import Container from "@/components/Container";


import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";


import { MdAutoGraph, MdDriveEta, MdInsertPhoto, MdQueryStats } from "react-icons/md";
import { BsClipboard2Check, BsGear, BsGearFill } from "react-icons/bs";
import { GrDocumentMissing } from "react-icons/gr";
import { FaDatabase, FaUserCheck } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { Round } from "@/lib/client/StatsMath";
import { match } from "assert";


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

  useEffect(() => {
    const scoutingStats = () => {
      setLoadingScoutStats(true);
      let submittedCount = 0;
      reports.forEach((report) => {
        if(report.submitted) {submittedCount++;}
      })
      setSubmissionRate(Round(submittedCount/reports.length))
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
    
      console.log("loaded users");
      console.log(Object.keys(newUsersById).length);
    
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
      scoutingStats();
    }

    loadUsers();
    loadMatches();
    loadReports();
  }, [])

  const { session, status } = useCurrentSession();
  
  return <Container requireAuthentication={true} hideMenu={false}>
      <div className="min-h-screen w-full flex flex-row items-center justify-center  space-x-6 space-y-6">
        <div className="w-2/5 flex flex-col space-y-4">
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

        <div className="w-2/5 flex flex-col space-y-4">
          <div className="w-full card bg-base-200 shadow-xl">
            <div className="card-body">
              <h1 className="card-title text-3xl font-bold">{team?.name} - {team?.number}</h1>
              <div className="divider"></div>
              {loadingMatches || loadingReports || loadingUsers ? <div className="w-full flex items-center justify-center"><BsGearFill className="animate-spin-slow" size={75}></BsGearFill></div>:
              <div className="w-full flex flex-col items-center space-y-2">
                <div className="carousel carousel-center max-w-lg h-64 p-4 space-x-4 bg-base-100 rounded-box">
                  {qualificationMatches.map((match) => <div className="carousel-item w-full flex flex-col items-center space-y-1" key={match._id}>

                    <h1 className="text-lg font-light">Current Match:</h1>
                    <h1 className="text-2xl font-bold mb-4">Match {match.number}</h1>
                    <div className="flex flex-col items-center space-y-4">
                  <div className="w-full flex flex-row items-center space-x-2">
                    {
                      match.reports.map((reportId) => {
                        const report = reportsById[reportId];
                        const submitted = report.submitted;
                        let color = !submitted ? (report.color===AllianceColor.Red?"bg-red-500":"bg-blue-500"): "bg-slate-500";
                        
                        if(!report) return <></>
                        return <Link href={`/${team?.slug}/${season?.slug}/${comp?.slug}/${reportId}`} key={reportId} className={`${color} rounded-lg w-12 h-12 flex items-center justify-center text-white border-2 border-white`}>
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
                            <div className="w-10 rounded-full">
                              <img src={user?.image} />
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
