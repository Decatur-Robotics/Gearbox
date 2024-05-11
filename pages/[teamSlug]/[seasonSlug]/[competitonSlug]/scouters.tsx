import Container from "@/components/Container";
import { Collections, GetDatabase } from "@/lib/MongoDB";
import { Competition, Match, Team, User, Report } from "@/lib/Types";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";
import ClientAPI from "@/lib/client/ClientAPI";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

const api = new ClientAPI("gearboxiscool");

export default function Scouters(props: { team: Team | null, competition: Competition | null}) {
  const team = props.team;
  const comp = props.competition;

  const { session, status } = useCurrentSession();
  const isManager = session?.user?._id
    ? team?.owners.includes(session.user?._id)
    : false;

  type Scouter = User & { missedReports: string[], reports: string[], coveredReports: string[] };
  type Comment = {
    text: string,
    user: string | undefined,
    robot: number,
    match: string,
    report: string,
    flag: "None" | "Minor" | "Major"
  }

  const [scouters, setScouters] = useState<{ [id: string]: Scouter } | undefined>();
  const [shouldRegenerateScouterData, setShouldRegenerateScouterData] = useState<boolean>(false);

  const [matches, setMatches] = useState<{ [id: string]: Match } | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [reports, setReports] = useState<{ [id: string]: Report } | undefined>();
  const [lastCountedMatch, setLastCountedMatch] = useState<number>(comp?.matches.length || 0);

  const [comments, setComments] = useState<Comment[] | undefined>();

  useEffect(() => {
    if (scouters && matches && reports || loading) return;

      setLoading(true);

      console.log("Loading scouter data...");
      api.findScouterManagementData(comp?._id ?? "", team?.scouters ?? []).then((data) => {
        console.log("Loaded scouter data");

        // Load scouters
        const scouterDict: { [id: string]: Scouter } = {};
        for (const s of data.scouters) {
          scouterDict[s._id ?? ""] = {
            ...s,
            missedReports: [],
            reports: [],
            coveredReports: []
          };
        }

        setScouters(scouterDict);

        // Load matches
        const matchDict: { [id: string]: Match } = {};
        for (const m of data.matches) {
          matchDict[m._id ?? ""] = m;
        }
        setMatches(matchDict);

        // Load reports and comments
        const reportDict: { [id: string]: Report } = {};
        const comments: Comment[] = [];
        for (const r of data.reports) {
          if (r.submitted) {
            const text = r.data.comments;

            let flag: "None" | "Minor" | "Major" = "None";
            if (text.length === 0) flag = "Minor";

            // Regex fails to filter out Japanese characters. Don't know why, so I'm just going to disable it for now.
            // const regex = /^[~`!@#$%^&*()_+=[\]\\{}|;':",.\/<>?a-zA-Z0-9-]+$/;
            // if ("aこんにちは".match(regex) === null) flag = "Minor";

            const comment: Comment = {
              text: text,
              user: r.submitter ?? r.user,
              robot: r.robotNumber,
              match: r.match,
              report: r._id ?? "",
              flag: flag
            }
            comments.push(comment);
          }

          reportDict[r._id ?? ""] = r;
        }
        setReports(reportDict);
        setComments(comments);

        setShouldRegenerateScouterData(true);
        setLoading(false);
    });
  });

  useEffect(() => {
    if (shouldRegenerateScouterData && scouters && matches && reports) {
      console.log("Regenerating scouter data...");

      const newScouters = Object.values(scouters).map((scouter) => {
        const scouterReports = Object.values(reports).filter((report) => {
          return matches[report.match].number <= lastCountedMatch && report.user === scouter._id;
        });

        const missedReports = scouterReports.filter((report) => {
          return !report.submitted || (report.submitter && report.submitter !== scouter._id);
        });

        const coveredReports = Object.values(reports).filter((report) => {
          return report.submitted && report.submitter && report.user !== scouter._id && report.submitter === scouter._id;
        });

        return {
          ...scouter,
          missedReports: missedReports.map((report) => report._id ?? ""),
          reports: scouterReports.map((report) => report._id ?? ""),
          coveredReports: coveredReports.map((report) => report._id ?? "")
        };
      });

      const scouterDict: { [id: string]: Scouter } = {};
      for (const scouter of newScouters) {
        scouterDict[scouter._id ?? ""] = scouter;
      }

      setScouters(scouterDict);
      setShouldRegenerateScouterData(false);
    }
  }, [shouldRegenerateScouterData, lastCountedMatch]);

  function removeComment(comment: Comment) {
    if (!confirm(`Are you sure you want to remove this comment?\nText: ${comment.text}\nScouter: ${scouters && scouters[comment.user ?? ""].name}`)) 
      return;

    if (!reports) return;

    console.log("Removing comment...", comment);
    const { _id, ...updated } = reports[comment.report];
    updated.data.comments = "";
    api.updateReport(updated, comment.report).then(() => {
      setComments((prev) => [...(prev || []).filter((c) => c !== comment), { ...comment, text: "" }]);
    });
  }
    
  return (<Container requireAuthentication={true} hideMenu={false}>
    {
      !isManager ? 
        <div className="card w-1/3 max-sm:w-2/3 bg-base-200 m-12">
          <div className="card-body">
            <h1 className="card-title">Not Authorized</h1>
            <p>Only managers are allowed to access this page.</p>
          </div>
        </div>
         : <div className="flex flex-row max-sm:flex-col justify-center">
            <div className="card w-1/3 max-sm:w-3/4 bg-base-200 m-12">
              <div className="card-body h-screen overflow-y-scroll">
                <h1 className="card-title">Scouters</h1>
                <p>
                  Scouters: {scouters && Object.keys(scouters)?.length}<br />
                  Matches: {comp && comp?.matches.length}<br />
                  Reports:{" "}
                    {reports 
                      ? Object.values(reports).filter(r => r.submitted).length 
                      : <div className="loading loading-spinner loading-xs"></div>}
                    /{comp && comp?.matches.length * 6}
                    {" "}(submitted/total) <br />
                  <span className="tooltip" data-tip="Reports for this match and any before it that are not submitted will be considered missing.">
                    Last Counted Match:
                  </span>
                  <input type="number" value={lastCountedMatch} className="input input-bordered input-sm ml-2 w-1/5 sm:w-1/6"
                    onChange={(e) => {
                      setShouldRegenerateScouterData(true);
                      setLastCountedMatch(Math.max(Math.min(parseInt(e.target.value), comp?.matches.length ?? 0), 0));
                    }} />
                </p>
                <ul>
                {
                  scouters && Object.values(scouters)?.filter((scouter) => scouter.reports.length > 0)
                    .sort((a, b) => b.missedReports.length - a.missedReports.length)
                    .map((scouter, index) => <li key={index}>
                      <span className={scouter.missedReports.length > 0 ? "text-warning" : ""}>{scouter.name}</span>
                      <ul className="text-sm ml-2 mb-1">
                        <li>Missed Reports: {scouter.missedReports.length} ({reports && scouter.missedReports.map((report) => reports[report]).filter((report) => !report.submitter).length} not covered)
                          {
                            matches && reports && scouter.missedReports.length > 0 && 
                              <ul className="ml-2">
                                {scouter.missedReports.map((report) => reports[report]).map((report) => ({
                                  report: report,
                                  match: matches[report.match]
                                })).sort((a, b) => a.match.number - b.match.number).map((entry, index) => {
                                  return <li key={index}>{entry.match.number}: {entry.report.robotNumber} {entry.report.submitter && <>(Covered by {scouters[entry.report.submitter]?.name ?? "Unknown"})</>}</li>
                                })}
                              </ul>
                          }
                        </li>
                        {
                          scouter.coveredReports.length > 0 && <li>
                            Covered Reports: {scouter.coveredReports.length}
                          </li>
                        }
                        <li>Submitted Reports: {scouter.reports.length - scouter.missedReports.length}/{scouter.reports.length}</li>
                      </ul>
                    </li>)
                }
                </ul>
              </div>
            </div>
            <div className="card w-1/3 max-sm:w-3/4 bg-base-200 m-12">
              <div className="card-body h-screen overflow-y-scroll overflow-x-hidden">
                <h1 className="card-title">Comments</h1>
                <ul>
                  {
                    scouters && matches && comments && comments.sort((a, b) => matches[a.match].number - matches[b.match].number)
                      .map((comment, index) => <li className="mb-1" key={index}>
                        <div className="flex flex-row space-x-2 items-center text-sm w-full justify-between">
                          <span className={comment.flag === "Major" ? "text-error" : comment.flag === "Minor" ? "text-warning" : ""}>
                            {comment.text !== "" ? comment.text : "[Empty Comment]"}
                          </span>
                          <button className="btn btn-warning btn-sm" onClick={() => removeComment(comment)}>Remove</button>
                        </div>
                        <ul className="text-xs ml-2">
                          <li>Match: {matches[comment.match].number}</li>
                          <li>Robot: {comment.robot}</li>
                          <li>Submitter: {comment.user ? scouters[comment.user]?.name ?? "Unknown" : "Unknown"}</li>
                        </ul>
                      </li>)
                  }
                </ul>
              </div>
            </div>
        </div>
    }
  </Container>);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();

  const teamSlug = context.params?.teamSlug as string;
  const team = await db.findObject(Collections.Teams, { slug: teamSlug });

  const compSlug = context.params?.competitonSlug as string;
  const comp = await db.findObject(Collections.Competitions, {
    slug: compSlug,
  });

  return {
    props: { team: SerializeDatabaseObject(team), competition: SerializeDatabaseObject(comp) },
  };
};