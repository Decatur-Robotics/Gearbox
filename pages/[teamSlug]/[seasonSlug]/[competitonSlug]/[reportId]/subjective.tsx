import Container from "@/components/Container";
import { Match, SubjectiveReportSubmissionType } from "@/lib/Types";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { Analytics } from "@/lib/client/Analytics";
import ClientAPI from "@/lib/client/ClientAPI";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import useInterval from "@/lib/client/useInterval";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React from "react";
import { useEffect, useState } from "react";

const api = new ClientAPI("gearboxiscool");

export default function Subjective(props: ResolvedUrlData) {
  const router = useRouter();
  const { teamSlug, seasonSlug, competitonSlug, reportId: matchId } = router.query;
  const session = useCurrentSession();

  const [match, setMatch] = useState<Match | undefined>();

  const submitButtonRef = React.createRef<HTMLButtonElement>();

  useEffect(() => {
    if (match)
      return;

    api.findMatchById(matchId as string).then(setMatch);
  }, [match]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let valid = [...(e.target as any)].filter((element: any) => element.value).length > 0;
    if (!valid) {
      if (submitButtonRef.current) {
        const btn = submitButtonRef.current;

        btn.classList.add("btn-error");
        btn.innerText = "Please fill out at least one field";
        setTimeout(() => {
          btn.classList.remove("btn-error");
          btn.innerText = "Submit";
        }, 1500);
      }

      return;
    }

    api.submitSubjectiveReport({
      _id: undefined,
      match: matchId as string,
      matchNumber: match?.number ?? 0,
      wholeMatchComment: (e.target as any)[0].value,
      robotComments: Object.fromEntries(
        [...(e.target as any)].slice(1).map((element: any, index: number) => 
          [match?.blueAlliance.concat(match.redAlliance)[index], element.value])
      ),
      submitter: undefined,
      submitted: SubjectiveReportSubmissionType.NotSubmitted
    }, session.session.user?._id!, teamSlug as string).then((res) => {
      window.location.href = `/${teamSlug}/${seasonSlug}/${competitonSlug}`;
    });

    const teamsWithComments = [...(e.target as any)].map((element: any, index: number) =>
      ["Whole Match"].concat(match?.blueAlliance.concat(match.redAlliance).map((n) => n.toString()) ?? [])[index]
    );

    Analytics.subjectiveReportSubmitted(teamsWithComments, props.team?.number ?? -1, props.competition?.name ?? "Unknown Competition", 
      session.session.user?.name ?? "Unknown User");
  }

  // We have to use router as a dependency because it is only populated after the first render (during hydration)
  useInterval(() => api.checkInForSubjectiveReport(matchId as string), 5000, [router]);

  return (
    <Container requireAuthentication={true} hideMenu={false} title={`${match?.number} | Subjective Scouting`}>
      <div className="flex flex-col items-center p-12">
            { !match 
              ? 
                <div className="loading loading-spinner"/>
              : 
              <div className="card w-[80%] bg-base-200">
                <div className="card-body">
                  <div className="card-title">
                    Match {match.number}
                  </div>
                  <form className="flex flex-col" onSubmit={submit}>
                    { 
                      ["Whole Match", ...match.blueAlliance, ...match.redAlliance].map((team, index) => (
                        <div key={index}>
                          <div className="label">
                            <span className={`label-text text-lg ${typeof(team) === "number" 
                              && (match.blueAlliance.includes(team) ? "text-blue-500" : "text-red-500")}`}>
                              {team}
                            </span>
                          </div>
                          <textarea className="input input-bordered w-full h-20" placeholder="Enter comments here..."/>
                        </div>
                      ))
                    }
                    <button ref={submitButtonRef} className="btn btn-primary mt-6">Submit</button>
                  </form>
                </div>
              </div>
            }
      </div>
    </Container>
  );
}