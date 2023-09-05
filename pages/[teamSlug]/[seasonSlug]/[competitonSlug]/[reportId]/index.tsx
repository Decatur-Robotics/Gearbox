import Container from "@/components/Container";
import UrlResolver, {ResolvedUrlData} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import ClientAPI from "@/lib/client/ClientAPI";
import { Form } from "@/lib/Types";
import PreviewElement from "@/components/PreviewElement";
import { useSocketIO } from "@/lib/client/useSocketIO";

const api = new ClientAPI("gearboxiscool")

export default function ReportForm(props: ResolvedUrlData) {

    const report = props?.report;
    const number = report?.robotNumber;
    const color = report?.color === "Blue" ? "text-blue-500" : "text-red-500";
    const [submitted, setSubmitted]= useState(report?.submitted);

    const[loadingForm, setLoadingForm] = useState(false);
    const[form, setForm] = useState<Form>();

    const[io, connected] = useSocketIO();
    if(connected) {
      console.log("Connected!")
    }

    useEffect(() => {
      async function loadForm() {
        setLoadingForm(true);

          // REMOVE THE !
        if(!report?.data) {
          setForm(report?.data);
        } else {
          setForm(await api.findFormById(report?.form));
        }
        setLoadingForm(false)
      }

      if(!form) {
        loadForm();
      }
    }, []);

    function updateCallback(index: number, value: any) {
      const newForm = structuredClone(form) as Form;
      newForm.data[index].value = value;
      setForm(newForm);
    }

    function submit() {
      api.submitForm(report?._id, form);
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