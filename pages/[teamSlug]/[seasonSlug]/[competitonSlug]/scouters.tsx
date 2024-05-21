import Container from "@/components/Container";
import { Collections, getDatabase } from "@/lib/MongoDB";
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
    formType: string,
    matchNumber: number,
    dbId: string,
    flag: "None" | "Minor" | "Major",
    remove: () => void
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

        function getCommentFlag(text: string, allowZeroLength: boolean = false) {
          let flag: "None" | "Minor" | "Major" = "None";
          if (!allowZeroLength && text.length === 0) flag = "Minor";

          // Regex fails to filter out Japanese characters. Don't know why, so I'm just going to disable it for now.
          // const regex = /^[~`!@#$%^&*()_+=[\]\\{}|;':",.\/<>?a-zA-Z0-9-]+$/;
          // if ("aこんにちは".match(regex) === null) flag = "Minor";

          return flag;
        }

        async function removeComment(commentId: string | undefined, func: (c: Comment) => Promise<void>): Promise<void> {
          // Hacky way of getting the latest state when the function is being called from lambdas
          setComments((comments) => {
            const comment = comments?.find((c) => c.dbId === commentId);
            if (!comment) return;
      
            if (!confirm(`Are you sure you want to remove this comment?\nText: ${comment.text}\nScouter: ${scouters?.[comment.user ?? ""]?.name ?? "Unknown"}`)) 
              return comments;
      
            func(comment).then(() =>
              setComments((prev) => [...(prev || []).filter((c) => c !== comment), 
                { ...comment, text: "", flag: getCommentFlag(comment.text, false) }])
            );
      
            return comments;
          });
        }
      
        function removeQuantitativeComment(comment: Comment) {
          let promise: Promise<void> | undefined;

          setReports((reports) => {
            if (!reports) return reports;
        
            const { _id, ...updated } = reports[comment.dbId];
            promise = api.updateReport({ data: { ...updated.data, comments: "" } }, comment.dbId);

            return reports;
          });

          return promise ?? Promise.resolve();
        }
      
        function removePitComment(comment: Comment) {
          return api.updatePitreport(comment.dbId, { comments: "" });
        }

        function removeSubjectiveComment(comment: Comment) {
          return api.updateSubjectiveReport(comment.dbId, { wholeMatchComment: "", robotComments: {} });
        }

        // Load reports and comments
        const comments: Comment[] = [];

        const reportDict: { [id: string]: Report } = {};
        for (const r of data.quantitativeReports) {
          if (r.submitted) {
            comments.push({
              text: r.data.comments,
              user: r.submitter ?? r.user,
              robot: r.robotNumber,
              formType: "Quantitative Report",
              matchNumber: matchDict[r.match]?.number ?? 0,
              dbId: r._id ?? "",
              flag: getCommentFlag(r.data.comments),
              remove: () => removeComment(r._id, removeQuantitativeComment)
            });
          }

          reportDict[r._id ?? ""] = r;
        }
        setReports(reportDict);

        for (const report of data.pitReports) {
          comments.push({
            text: report.comments,
            user: report.submitter,
            robot: report.teamNumber,
            formType: "Pit Report",
            matchNumber: 0,
            dbId: report._id ?? "",
            flag: getCommentFlag(report.comments),
            remove: () => removeComment(report._id, removePitComment)
          });
        }

        for (const report of data.subjectiveReports) {
          const text = [
            (report.wholeMatchComment.length > 0 ? `Whole Match: ${report.wholeMatchComment}` : ""),
            ...Object.entries(report.robotComments)
              .map(([key, value]) => value.length > 0 && `Robot ${key}: ${value}`)]
              .filter((c) => c)
              .join(" \\ ");

          comments.push({
            text: text,
            user: report.submitter,
            robot: 0,
            formType: "Subjective Report",
            matchNumber: matchDict[report.match]?.number ?? 0,
            dbId: report._id ?? "",
            flag: getCommentFlag(text),
            remove: () => removeComment(report._id, (c) => removeSubjectiveComment(c))
          });
        }

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
                    scouters && matches && comments && comments.sort((a, b) => a.matchNumber - b.matchNumber)
                      .map((comment, index) => <li className="mb-1" key={index}>
                        <div className="flex flex-row space-x-2 items-center text-sm w-full justify-between">
                          <span className={comment.flag === "Major" ? "text-error" : comment.flag === "Minor" ? "text-warning" : ""}>
                            {comment.text !== "" ? comment.text : "[Empty Comment]"}
                          </span>
                          <button className="btn btn-warning btn-sm" onClick={comment.remove}>Remove</button>
                        </div>
                        <ul className="text-xs ml-2">
                          <li>{comment.formType}</li>
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
  const db = await getDatabase();

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