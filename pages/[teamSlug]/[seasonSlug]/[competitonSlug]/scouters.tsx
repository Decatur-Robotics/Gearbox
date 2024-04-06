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

  const [scouters, setScouters] = useState<Scouter[] | undefined>();
  const [matches, setMatches] = useState<{ [id: string]: Match } | undefined>();
  const [reports, setReports] = useState<{ [id: string]: Report } | undefined>();
  const [lastCountedMatch, setLastCountedMatch] = useState<number>(comp?.matches.length || 0);
  const [shouldRegenerateScouterData, setShouldRegenerateScouterData] = useState<boolean>(false);

  useEffect(() => {
    if (!scouters) {
      team?.scouters.forEach(async (scouter) => {
        const user = await api.findUserById(scouter);
        setScouters((prev) => [...(prev || []), {
          ...user,
          missedReports: [],
          reports: []
        }]);
      });
      setScouters([]);
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

      const newScouters = scouters.map((scouter) => {
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

      setScouters(newScouters);
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
         : <div className="flex flex-row max-sm:flex-col">
            <div className="card w-1/3 max-sm:w-2/3 bg-base-200 m-12">
              <div className="card-body">
                <h1 className="card-title">Scouters</h1>
                <p>
                  Scouters: {scouters?.length}<br />
                  Matches: {matches && Object.keys(matches)?.length}/{comp && comp?.matches.length} (loaded/total)<br />
                  Reports:{" "}
                    {reports && Object.values(reports).filter(r => r.submitted).length}
                    /{reports && Object.keys(reports).length}
                    /{comp && comp?.matches.length * 6}
                    {" "}(submitted/loaded/total) <br />
                  <span className="tooltip" data-tip="Reports for this match and any before it that are not submitted will be considered missing.">
                    Last Counted Match:
                  </span>
                  <input type="number" value={lastCountedMatch} className="input input-bordered input-sm ml-2 w-1/6"
                    onChange={(e) => {
                      setShouldRegenerateScouterData(true);
                      setLastCountedMatch(Math.max(Math.min(parseInt(e.target.value), comp?.matches.length ?? 0), 0));
                    }} />
                </p>
                <ul>
                {
                  scouters?.filter((scouter) => scouter.reports.length > 0).map((scouter) => <li key={scouter._id}>
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