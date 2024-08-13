import ClientAPI from "@/lib/client/ClientAPI";
import { updateCompInLocalStorage } from "@/lib/client/offlineUtils";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import useInterval from "@/lib/client/useInterval";
import { Match, SubjectiveReport, SubjectiveReportSubmissionType } from "@/lib/Types";
import { BSON } from "bson";
import { useRouter } from "next/router";
import React, { createRef, FormEvent, useState } from "react";
import Loading from "./Loading";
import Card from "./Card";
import QRCode from "react-qr-code";
import { Analytics } from "@/lib/client/Analytics";

const api = new ClientAPI("gearboxiscool");

export default function SubjectiveReportForm(props: { match: Match, compId?: string, teamNumber?: number, compName?: string }) {
  const router = useRouter();
  const { teamSlug, seasonSlug, competitonSlug } = router.query;
  
  const { match } = props;
  
  const session = useCurrentSession();

  const submitButtonRef = createRef<HTMLButtonElement>();

  const [submitting, setSubmitting] = useState(false);

  const [report, setReport] = useState<SubjectiveReport | undefined>(undefined);

  function getReportFromForm(e: FormEvent<HTMLFormElement>): SubjectiveReport {
    return {
      _id: undefined,
      ownerTeam: match.ownerTeam,
      ownerComp: match.ownerComp,
      match: match._id as string,
      matchNumber: match?.number ?? 0,
      wholeMatchComment: (e.target as any)[0].value,
      robotComments: Object.fromEntries(
        [...(e.target as any)].slice(1).map((element: any, index: number) => 
          [match?.blueAlliance.concat(match.redAlliance)[index], element.value])
      ),
      submitter: undefined,
      submitted: SubjectiveReportSubmissionType.NotSubmitted
    };
  }

  function updateReport(e: FormEvent<HTMLFormElement>) {
    setReport(getReportFromForm(e));
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

    api.submitSubjectiveReport(getReportFromForm(e), session?.session?.user?._id!, teamSlug as string)
      .catch((err) => {
        console.error(err);

        if (!props.compId)
          return;

        updateCompInLocalStorage(props.compId, (comp) => {
          const subjectiveReport: SubjectiveReport = { 
            ...getReportFromForm(e),
            _id: new BSON.ObjectId().toHexString()
          };

          comp.subjectiveReports[subjectiveReport._id!] = subjectiveReport;
          comp.matches[match._id as string].subjectiveReports.push(subjectiveReport._id!);
        });
      })
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
  useInterval(() => api.checkInForSubjectiveReport(match._id as string), 5000, [router]);
  
  return (   
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
                      <textarea className="input input-bordered w-full h-20" placeholder="Enter comments here..."/>
                    </div>
                  ))
                }
                <button ref={submitButtonRef} className={`btn btn-${submitting ? "disabled" : "primary"} mt-6`}>
                  {submitting ? <Loading bg="" size={42} /> : "Submit"}
                </button>
              </form>
            </div>
          </div>
          <Card title="Share while offline" className="w-[80%]">
            <div className="w-full flex justify-center">
              <QRCode value={JSON.stringify({
                subjectiveReport: {
                  ...report,
                  _id: new BSON.ObjectId().toHexString()
                }
              })} />
            </div>
          </Card>
        </>
      }
    </div>
  );
}