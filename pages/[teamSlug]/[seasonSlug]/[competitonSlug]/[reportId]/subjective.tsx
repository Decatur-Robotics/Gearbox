import ClientApi from "@/lib/api/ClientApi";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import useInterval from "@/lib/client/useInterval";
import { Match, SubjectiveReport, SubjectiveReportSubmissionType } from "@/lib/Types";
import { useRouter } from "next/router";
import React, { createRef, FormEvent, useEffect, useState } from "react";
import { Analytics } from "@/lib/client/Analytics";
import Loading from "@/components/Loading";
import { makeObjSerializeable } from "@/lib/client/ClientUtils";
import UrlResolver from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";

const api = new ClientApi();

export default function SubjectiveReportForm(props: { compId?: string, teamNumber?: number, compName?: string }) {
  const router = useRouter();
  const { teamSlug, seasonSlug, competitonSlug, reportId: matchId } = router.query;
  
  const [match, setMatch] = useState<Match>();
  
  const session = useCurrentSession();

  const submitButtonRef = createRef<HTMLButtonElement>();

  const [submitting, setSubmitting] = useState(false);

  const [report, setReport] = useState<SubjectiveReport | undefined>(undefined);

  useEffect(() => {
    if (matchId) {
      api.findMatchById(matchId as string)
        .then((match) => setMatch(match));
    }
  }, [matchId]);

  function getReportFromForm(): SubjectiveReport {
    return {
      _id: undefined,
      match: match?._id as string,
      matchNumber: match?.number ?? 0,
      wholeMatchComment: (document.getElementById("comment-WholeMatch") as HTMLTextAreaElement)?.value ?? "",
      robotComments: Object.fromEntries(
        match?.blueAlliance.concat(match.redAlliance).map((team: number, index: number) => 
          [match?.blueAlliance.concat(match.redAlliance)[index], (document.getElementById(`comment-${team}`) as HTMLTextAreaElement).value ?? ""]) ?? []
      ),
      submitter: undefined,
      submitted: SubjectiveReportSubmissionType.NotSubmitted
    };
  }

  function updateReport() {
    setReport(getReportFromForm());
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);

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

      setSubmitting(false);
      return;
    }

    api.submitSubjectiveReport(getReportFromForm(), matchId as string)
      .then(() => {
        const teamsWithComments = [...(e.target as any)].map((element: any, index: number) =>
          ["Whole Match"].concat(match?.blueAlliance.concat(match.redAlliance).map((n) => n.toString()) ?? [])[index]
        );
    
        Analytics.subjectiveReportSubmitted(teamsWithComments, props.teamNumber ?? -1, props.compName ?? "Unknown Competition", 
          session.session.user?.name ?? "Unknown User");
      })
      .finally(() => {
        if (location.href.includes("offline"))
          location.href = `/offline/${props.compId}`;
        else
          location.href = `/${teamSlug}/${seasonSlug}/${competitonSlug}`;
      });
  }

  // We have to use router as a dependency because it is only populated after the first render (during hydration)
  useInterval(() => api.checkInForSubjectiveReport(matchId as string).catch(console.error), 5000, [router, match?._id]);
  
  return (   
    <Container requireAuthentication title="Subjective Scouting">
      <div className="flex flex-col items-center p-12 space-y-6">
        { !match 
          ? 
            <div className="loading loading-spinner"/>
          : <>
            <div className="card w-[80%] bg-base-200">
              <div className="card-body">
                <div className="card-title">
                  Match {match.number}
                </div>
                <form className="flex flex-col" onSubmit={submit} onChange={updateReport} >
                  { 
                    ["Whole Match", ...match.blueAlliance, ...match.redAlliance].map((team, index) => (
                      <div key={index}>
                        <div className="label">
                          <span className={`label-text text-lg ${typeof(team) === "number" 
                            && (match.blueAlliance.includes(team) ? "text-blue-500" : "text-red-500")}`}>
                            {team}
                          </span>
                        </div>
                        <textarea id={`comment-${team.toString().replace(" ", "")}`} className="input input-bordered w-full h-20" placeholder="Enter comments here..."/>
                      </div>
                    ))
                  }
                  <button ref={submitButtonRef} className={`btn btn-${submitting ? "disabled" : "primary"} mt-6`}>
                    {submitting ? <Loading bg="" size={42} /> : "Submit"}
                  </button>
                </form>
              </div>
            </div>
          </>
        }
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { matchSlug } = context.params as any;

  const resolved = await UrlResolver(context, 1);

  if ("redirect" in resolved) {
    return resolved;
  }

  return {
    props: {
      compId: resolved.competition?._id?.toString(),
      compName: resolved.competition?.name,
      teamNumber: resolved.team?.number,
    }
  };
};
