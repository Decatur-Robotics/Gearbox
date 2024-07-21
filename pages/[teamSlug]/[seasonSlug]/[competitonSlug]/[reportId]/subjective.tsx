import Container from "@/components/Container";
import SubjectiveReportForm from "@/components/SubjectiveReportForm";
import { Match, SubjectiveReportSubmissionType } from "@/lib/Types";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
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
  const { reportId: matchId } = router.query;

  const [match, setMatch] = useState<Match | undefined>();

  useEffect(() => {
    if (match)
      return;

    api.findMatchById(matchId as string).then(setMatch);
  }, [match]);

  return (
    <Container requireAuthentication={true} hideMenu={false}>
      { match
          ? <SubjectiveReportForm match={match} />
          : <div>Loading...</div>
      }
    </Container>
  );
}