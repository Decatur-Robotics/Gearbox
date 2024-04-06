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

  type Scouter = User & { missedReports: string[], reports: string[] };
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
  const [reports, setReports] = useState<{ [id: string]: Report } | undefined>();
  const [lastCountedMatch, setLastCountedMatch] = useState<number>(comp?.matches.length || 0);

  const [comments, setComments] = useState<Comment[] | undefined>();

  useEffect(() => {
    if (!scouters) {
      team?.scouters.forEach(async (scouter) => {
        const user = await api.findUserById(scouter);
        setScouters((prev) => ({...(prev || {}), [scouter]: {
          ...user,
          missedReports: [],
          reports: []
        }}));
      });
      setScouters({});
    }

    if (!matches) {
      comp?.matches.forEach(async (match) => {
        const m = await api.findMatchById(match);
        setMatches((prev) => ({...(prev || {}), [match]: m}));
      });

      setMatches({});
    }
    else if (Object.values(matches).length === comp?.matches.length && reports === undefined) {
      const values = Object.values(matches);
      values.forEach((match) => {
        match.reports.map(async (report) => {
          const r = await api.findReportById(report);
          setReports((prev) => {
            if (Object.keys(prev || {}).length + 6 >= lastCountedMatch * 6)
              setShouldRegenerateScouterData(true);

            if (r.submitted) {
              const text = r.data.comments;

              let flag: "None" | "Minor" | "Major" = "None";
              if (text.length === 0) flag = "Minor";

              // Regex fails to filter out Japanese characters. Don't know why, so I'm just going to disable it for now.
              // const regex = /^[~`!@#$%^&*()_+=[\]\\{}|;':",.\/<>?a-zA-Z0-9-]+$/;
              // if ("aこんにちは".match(regex) === null) flag = "Minor";

              const comment: Comment = {
                text: text,
                user: r.user,
                robot: r.robotNumber,
                match: r.match,
                report: report,
                flag: flag
              }
              setComments((prev) => [...(prev || []), comment]);
            }

            return { ...(prev || {}), [report]: r }
          });
        });
      });
      setReports({});
    }
  });

  useEffect(() => {
    if (shouldRegenerateScouterData && scouters && matches && reports) {
      console.log("Regenerating scouter data...");

      const newScouters = Object.values(scouters).map((scouter) => {
        const scouterReports = Object.values(reports).filter((report) => {
          return matches[report.match].number <= lastCountedMatch && report.user === scouter._id;
        });

        const missedReports = scouterReports.filter((report) => {
          return !report.submitted;
        });

        return {
          ...scouter,
          missedReports: missedReports.map((report) => report._id ?? ""),
          reports: scouterReports.map((report) => report._id ?? "")
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
                  Matches: {matches && Object.keys(matches)?.length}/{comp && comp?.matches.length} (loaded/total)<br />
                  Reports:{" "}
                    {reports && Object.values(reports).filter(r => r.submitted).length}
                    /{reports && Object.keys(reports).length}
                    /{comp && comp?.matches.length * 6}
                    {" "}(submitted/loaded/total) <br />
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
                  scouters && Object.values(scouters)?.filter((scouter) => scouter.reports.length > 0).map((scouter) => <li key={scouter._id}>
                    <span className={scouter.missedReports.length > 0 ? "text-warning" : ""}>{scouter.name}</span>
                    <ul className="text-sm ml-2 mb-1">
                      <li>Missed Reports: {scouter.missedReports.length}
                        {
                          matches && reports && scouter.missedReports.length > 0 && 
                            <ul className="ml-2">
                              {scouter.missedReports.map((report) => reports[report]).map((report) => ({
                                report: report,
                                match: matches[report.match]
                              })).sort((a, b) => a.match.number - b.match.number).map((entry) => {
                                return <li key={entry.match._id}>{entry.match.number}: {entry.report.robotNumber}</li>
                              })}
                            </ul>
                        }
                      </li>
                      <li>Submitted Reports: {scouter.reports.length - scouter.missedReports.length}/{scouter.reports.length}</li>
                    </ul>
                  </li>)
                }
                </ul>
              </div>
            </div>
            <div className="card w-1/3 max-sm:w-3/4 bg-base-200 m-12">
              <div className="card-body h-screen overflow-y-scroll">
                <h1 className="card-title">Comments</h1>
                <ul>
                  {
                    scouters && matches && comments && comments.sort((a, b) => matches[a.match].number - matches[b.match].number)
                      .map((comment) => <li className="mb-1" key={comment.report}>
                        <div className="flex flex-row space-x-2 align-middle items-center text-sm">
                          <span className={comment.flag === "Major" ? "text-error" : comment.flag === "Minor" ? "text-warning" : ""}>
                            {comment.text !== "" ? comment.text : "[Empty Comment]"}
                          </span>
                          <button className="btn btn-warning btn-sm" onClick={() => removeComment(comment)}>Remove</button>
                        </div>
                        <ul className="text-xs ml-2">
                          <li>Match: {matches[comment.match].number}</li>
                          <li>Robot: {comment.robot}</li>
                          <li>Scouter: {comment.user ? scouters[comment.user].name : "Unknown"}</li>
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