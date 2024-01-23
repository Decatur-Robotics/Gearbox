import { AllianceColor, Report, FormData } from "@/lib/Types";
import { useCallback, useState } from "react";
import { AutoPage, EndPage, TeleopPage } from "./FormPages";

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { TfiReload } from "react-icons/tfi";

import ClientAPI from "@/lib/client/ClientAPI";

const api = new ClientAPI("gearboxiscool")

export default function Form(props: {report: Report}) {

    const[page, setPage] = useState(1);
    const[formData, setFormData] = useState<FormData>(props.report?.data);
    const[syncing, setSyncing] = useState(false);

    const alliance = props.report?.color;

    async function submitForm() {
        await api.submitForm(props.report?._id, formData);
        console.log("hi");
       location.href = location.href.substring(0, location.href.lastIndexOf("/"));
    }

    const sync = async() => {
        setSyncing(true);
        await api.updateReport({data: formData}, props.report?._id);
        setSyncing(false);
    }

    const setCallback = useCallback((key: any, value: boolean | string | number)=>{
        
        setFormData((old) => {
            let copy = structuredClone(old);
            //@ts-expect-error
            copy[key] = value;
            sync();
            return copy;
        });
       
    }, []);


    return <div className="w-full flex flex-col items-center space-y-2">
            
            {page === 1 ? <AutoPage data={formData} callback={setCallback} alliance={alliance}></AutoPage> : <></>}
            {page === 2 ? <TeleopPage data={formData} callback={setCallback} alliance={alliance}></TeleopPage> : <></>}
            {page === 3 ? <EndPage data={formData} callback={setCallback} alliance={alliance} submit={submitForm}></EndPage> : <></>}
            
            <footer className="w-full h-full">
                <div className="card w-full bg-base-200">
                    <div className="card-body flex flex-col items-center">
                        <h2 className={`${alliance === AllianceColor.Blue ? "text-blue-500": "text-red-500"} font-bold text-5xl`}>#{[props.report.robotNumber]}</h2>
                        <div className="card-actions justify-between w-full">
                            <button className="btn btn-primary" disabled={page===1}  onClick={()=>{setPage(page-1)}}>
                                <FaArrowLeft />
                                Back
                            </button>

                            {syncing ? <p className="mt-3 text-md text-center"> <TfiReload className="animate-spin inline-block"></TfiReload> Syncing Changes</p>: <></>}

                            <button className="btn btn-primary" disabled={page===3} onClick={()=>{setPage(page+1)}}>
                                Next
                                <FaArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
    </div>
}