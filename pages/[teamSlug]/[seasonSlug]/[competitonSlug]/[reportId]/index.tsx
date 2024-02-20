import Container from "@/components/Container";
import { AllianceColor, Report, FormData } from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Form from "@/components/forms/Form";
import { GetServerSideProps } from "next";
import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";

export default function Homepage(props: ResolvedUrlData) {
  const team = props?.team;
  const season = props?.season;
  const comp = props?.competition;
  const report = props?.report;

  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      {report ? (
        <Form report={report}></Form>
      ) : (
        <p className="text-error">Welp.</p>
      )}
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: await UrlResolver(context),
  };
};

/* will redo
import Container from "@/components/Container";
import UrlResolver, {ResolvedUrlData} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { useEffect, useRef, useState } from "react";
import ClientAPI from "@/lib/client/ClientAPI";
import { Form } from "@/lib/Types";
import PreviewElement from "@/components/PreviewElement";
import { ClientSocket} from "@/lib/client/ClientSocket";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { Socket } from "socket.io-client";
import { emit } from "process";

const api = new ClientAPI("gearboxiscool")
let io: Socket<DefaultEventsMap, DefaultEventsMap>;

export default function ReportForm(props: ResolvedUrlData) {

    const team = props?.team;
    const season = props?.season;
    const comp = props?.competition;
    const report = props?.report;
    const number = report?.robotNumber;
    const color = report?.color === "Blue" ? "text-blue-500" : "text-red-500";
    const [submitted, setSubmitted]= useState(report?.submitted);

    const[loadingForm, setLoadingForm] = useState(false);
    const[form, setForm] = useState<Form>();
    const formRef = useRef<Form | undefined>();
    formRef.current = form;

    const[connected, setConnected] = useState(true);

    const[name, setName] = useState<string>("");

    useEffect(() => {

      async function loadForm() {
        setLoadingForm(true);
        if(report?.data) {
          setForm(report?.data);
        } else {
          setForm(await api.findFormById(report?.form));
        }

        const user = await api.findUserById(report?.user);
        setName(user.name ? user.name : "Error");

        setLoadingForm(false)
      }

      async function setupSocket() {
        io = await ClientSocket();

        io.on("connect", ()=>{setConnected(true)});
        io.on("disconnect", ()=>{setConnected(false)});

        io.on("form-update", (data) => {
          if(data._id === report?._id) {
            updateCallback(data.index, data.value, false)
          }
        })

        io.on("form-submit", (_id) => {
          if(_id === report?._id) {
            location.reload();
          }
        })
      }

      if(!form) {
        loadForm();
      }

      setupSocket();
    }, []);

    function updateCallback(index: number, value: any, emit=true) {
      const newForm = structuredClone(formRef.current) as Form;
      newForm.data[index].value = value;
      setForm(newForm);
      if(emit) {
        io.emit("form-update", {_id: report?._id, index: index, value: value})
      }  
    }

    async function submit() {
      io.emit("form-submit", report?._id)
      await api.submitForm(report?._id, form);
      location.href = `/${team?.slug}/${season?.slug}/${comp?.slug}`
    }

    return <Container requireAuthentication={true} hideMenu={false}>
      <div className="w-full h-full flex flex-col justify-center items-center">
          {submitted ? <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-2xl">Warning</h2>
                <p>This form has already been submitted</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary" onClick={()=>{setSubmitted(false)}}>Continue</button>
                </div>
            </div>
          </div> : <div className="w-full h-full flex flex-col justify-center items-center space-y-8">
          <div className="card w-5/6 bg-base-200 shadow-xl">
            <div className="card-body flex flex-col items-center">
                <h2 className={`card-title text-6xl animate-pulse ` + color}>#{number}</h2>
                <div className="divider "></div>
                <div className="w-full flex flex-row items-center justify-center">
               
                <h3>Intended Scouter: {name}</h3>
                <h3 className="">Live Sync Enabled <div className={`w-4 h-4 rounded-full ${connected ? "bg-success" : "bg-error"} animate-pulse inline-block translate-y-1 ml-1`}></div> </h3>
                </div>
                
            </div>
          </div> 
          
          {loadingForm ? <span className="loading loading-spinner loading-lg mt-10"></span>: <></>}
          {form?.data.map((element, index) => <PreviewElement data={element} index={index} key={index} callback={updateCallback}></PreviewElement>)}
          <button className="btn btn-primary w-1/2 h-16 text-2xl" onClick={submit}>Submit</button>
          </div>}
      </div>   
    </Container>

}

export const getServerSideProps: GetServerSideProps = async (context) => {
    return {
      props: await UrlResolver(context),
    }
  }
*/
