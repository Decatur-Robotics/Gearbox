
import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData, SerializeDatabaseObject } from "@/lib/UrlResolver";

import { GetDatabase, Collections} from "@/lib/MongoDB";
import { Competition, Report } from "@/lib/Types";
import { useEffect, useState } from "react";
import TeamPage from "@/components/stats/TeamPage";
import Picklist from "@/components/stats/Picklist";
import PicklistScreen from "@/components/stats/Picklist";

export default function Stats(props: {reports: Report[], competition: Competition}) {

   
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  const[page, setPage] = useState(0)

  const reports = props.reports;

  return <Container requireAuthentication={false} hideMenu={!hide}>
        <div role="tablist" className="tabs tabs-boxed">
          <a role="tab" className={`tab tab-md ${page===0 ? "tab-active": ""}`} onClick={()=>{setPage(0)}}>Teams</a>
          <a role="tab" className={`tab tab-md ${page===1 ? "tab-active": ""}`} onClick={()=>{setPage(1)}}>Picklist</a>
          <a role="tab" className={`tab tab-md ${page===2 ? "tab-active": ""}`} onClick={()=>{setPage(2)}}>Prediction</a>
        </div>

        {page === 0 ? <TeamPage reports={reports}></TeamPage>: <></>}
        {page === 1 ? <PicklistScreen reports={reports}></PicklistScreen>: <></>}
        
    </Container>

}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await GetDatabase();
  const url = await UrlResolver(context);
  const dbReports = await db.findObjects<Report>(Collections.Reports, {"match": {"$in": url.competition?.matches}, "submitted": true});
  const reports = dbReports.map((report) => SerializeDatabaseObject(report))
  return {
    props: {reports:  reports, competition: url.competition}
  }
}
