import Container from "@/components/Container";
import UrlResolver, {ResolvedUrlData} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { useState } from "react";
import ClientAPI from "@/lib/client/ClientAPI";

const api = new ClientAPI("gearboxiscool")

export default function ReportForm(props: ResolvedUrlData) {

    const report = props?.report;
    const number = report?.robotNumber;
    const color = report?.color === "Blue" ? "text-blue-500" : "text-red-500";
    const [submitted, setSubmitted]= useState(report?.submitted);

    return <Container requireAuthentication={true} hideMenu={false}>
      <div className="w-full h-full flex flex-col justify-center">
          {submitted ? <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-2xl">Warning</h2>
                <p>This form has already been submitted</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary" onClick={()=>{setSubmitted(false)}}>Continue</button>
                </div>
            </div>
          </div> : <></>}
      </div>
      
    </Container>

}

export const getServerSideProps: GetServerSideProps = async (context) => {
    return {
      props: await UrlResolver(context),
    }
  }