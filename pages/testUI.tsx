import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { FaArrowRight, FaArrowLeft, FaCube } from "react-icons/fa";
import { BsCone } from "react-icons/bs";

export default function Homepage() {

    const { session, status } = useCurrentSession();

    const hide = status === "authenticated";

    return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full min-h-screen flex flex-col items- space-y-5">
            <div className="card w-full lg:w-1/2 bg-base-200 shadow-xl mt-1">
                <div className="card-body flex flex-col items-center">
                    <h2 className=" text-blue-500 font-bold text-5xl">#4026</h2>

                    <div className="card-actions justify-between w-full">
                        <button className="btn btn-primary">
                            <FaArrowLeft />
                            Start
                        </button>

                        <h2 className="font-bold text-3xl">Auto</h2>

                        <button className="btn btn-primary">
                            Teleop
                            <FaArrowRight />
                        </button>
                    </div>
                </div>
            </div>

            <div className="card w-full lg:w-1/2 bg-base-200 shadow-xl mt-1">
                <div className="card-body flex flex-col items-center">
                    <div className="w-full">
                        <button className="btn btn-outline btn-block rounded-b-none border-b-0 p-10 flex flex-col text-xl">
                           <div><BsCone className="text-3xl" /></div>
                            High
                         </button>

                        <button className="btn btn-outline btn-block rounded-none p-10 flex flex-col text-xl"> 
                            <div><FaCube className="text-3xl" /></div> 
                            Middle
                        </button>

                        <button className="btn btn-outline btn-block rounded-t-none border-t-0 p-10 flex flex-col text-xl">
                            <div>
                                <FaCube className="text-3xl inline mr-2" />
                                <BsCone className="text-3xl inline-block" />
                            </div>  
                            Low
                        </button>
                    </div>

                    <div className="divider"></div>

                    <label className="label w-full cursor-pointer flex flex-row justify-center space-x-6">
                        <span className="label-text text-2xl">Balanced On Platform</span> 
                        <input type="checkbox" checked={true} className="checkbox checkbox-primary w-8 h-8" />
                    </label>

                    <label className="label w-full cursor-pointer flex flex-row justify-center space-x-6">
                        <span className="label-text text-2xl">Moved From Start</span> 
                        <input type="checkbox" checked={true} className="checkbox checkbox-accent w-8 h-8" />
                    </label>
                </div>
            </div>
        </div>
           
    </Container>

}