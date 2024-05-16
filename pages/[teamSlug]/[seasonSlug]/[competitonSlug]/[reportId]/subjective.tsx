import Container from "@/components/Container";
import { Match } from "@/lib/Types";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import ClientAPI from "@/lib/client/ClientAPI";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const api = new ClientAPI("gearboxiscool");

export default function Subjective() {
  const router = useRouter();
  const { reportId: matchId } = router.query;

  const [match, setMatch] = useState<Match | undefined>();

  useEffect(() => {
    if (match)
      return;

    api.findMatchById(matchId as string).then(setMatch);
  }, [match]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    api.submitSubjectiveReport({
      _id: undefined,
      match: matchId as string,
      wholeMatchComment: (e.target as any)[0].value,
      robotComments: Object.fromEntries(
        [...(e.target as any)].map((element: any, index: number) => [index, element.value])
      ),
      submitter: undefined
    })
  }

  return (
    <Container requireAuthentication={true} hideMenu={false}>
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
                    <button className="btn btn-primary mt-6">Submit</button>
                  </form>
                </div>
              </div>
            }
      </div>
    </Container>
  );
}