import { AllianceColor, Report, FormData } from "@/lib/Types";
import { useCallback, useState, useEffect } from "react";
import { AutoPage, EndPage, TeleopPage } from "./FormPages";
import {useCurrentSession} from "@/lib/client/useCurrentSession";

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { TfiReload } from "react-icons/tfi";

import { Socket } from "socket.io-client";
import { ClientSocket} from "@/lib/client/ClientSocket";
import { DefaultEventsMap } from "@socket.io/component-emitter";

import ClientAPI from "@/lib/client/ClientAPI";
import { useRouter } from "next/router";

const api = new ClientAPI("gearboxiscool")
//let io: Socket<DefaultEventsMap, DefaultEventsMap>;

export default function Form(props: {report: Report}) {
    const { session, status } = useCurrentSession();
    //const router = useRouter();

    const reportID = props.report._id

    /*
    useEffect(()=>{
        async function setUpSocket(){
            io = await ClientSocket()
            io.emit("update-checkin", reportID)
            await api.updateCheckIn(reportID)
          }
          //setUpSocket()

          async function checkOutOld(reportId : string | undefined){
            await api.updateCheckOut(reportId)
        }

        console.log("Adding event handlers for check out...");
        async function checkOut(reportId : string | undefined) {
            console.log("Checking out...");
            io.emit("update-checkout", reportID);
            console.log("Check out");
        }

        async function checkIn(reportId: string | undefined) {
            io.emit("update-checkin", reportID)
        }
    
        /*
        window.addEventListener("pagehide", async (event: PageTransitionEvent) => {
            // event.returnValue='Farts';
            event.preventDefault();
            checkOut(reportID);
        });

        window.addEventListener("beforeunload", async (event: BeforeUnloadEvent) => {
            event.preventDefault();
            checkOut(reportID);
        })

        window.addEventListener("visibilitychange", async (event: Event) => {
            event.preventDefault();

            console.log("Visibility changed to " + document.visibilityState);
            if(document.visibilityState === "hidden")
                checkOut(reportID);
            else io.emit("update-checkin", reportID)
        })

        //router.events.on("routeChangeStart", async () => checkOut(reportID));
        //router.events.on("beforeHistoryChange", async () => checkOut(reportID));

        //console.log("Added event handlers");

        
    })

    async function checkOut(){
        io.emit("update-checkout", reportID)
        await api.updateCheckOut(reportID)
    }

    async function checkIn(){
        io.emit("update-checkin", reportID)
    }
    */

    const[page, setPage] = useState(1);
    const[formData, setFormData] = useState<FormData>(props.report?.data);
    const[syncing, setSyncing] = useState(false);

    const alliance = props.report?.color;

    async function submitForm() {
        await api.submitForm(props.report?._id, formData, session?.user?._id, session?.user?.oweBucks);
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