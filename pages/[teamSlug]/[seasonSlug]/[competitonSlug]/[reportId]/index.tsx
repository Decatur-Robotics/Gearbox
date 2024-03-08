
import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Form from "@/components/forms/Form";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect } from "react";

export default function Homepage(props: ResolvedUrlData) {

    const team = props?.team;
    const season = props?.season;
    const comp = props?.competition;
    const report = props?.report;

    const { session, status } = useCurrentSession();
    const hide = (status === "authenticated");
    
    
    return <Container requireAuthentication={false} hideMenu={!hide}>
        {report ? <Form report={report}></Form> : <p className="text-error">Welp.</p>}
    </Container>

}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  }
}
