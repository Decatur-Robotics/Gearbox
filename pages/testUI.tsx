import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { FaArrowRight, FaArrowLeft, FaCube } from "react-icons/fa";
import { BsCone, BsSpeakerFill } from "react-icons/bs";
import { MdOutlineCallMissedOutgoing } from "react-icons/md";
import { GiAmplitude } from "react-icons/gi";
import { IoPush } from "react-icons/io5";

export default function Homepage() {

    const { session, status } = useCurrentSession();

    const hide = status === "authenticated";

    return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full min-h-screen flex flex-col items-center space-y-5">
            <div className="card w-full lg:w-1/2 bg-base-200 shadow-xl mt-1">
                <div className="card-body flex flex-col items-center">
                    <h2 className=" text-blue-500 font-bold text-5xl">#4026</h2>

                    <div className="card-actions justify-between w-full">
                        <button className="btn btn-primary">
                            <FaArrowLeft />
                            Auto
                        </button>

                        <h2 className="font-bold text-3xl">Teleop</h2>

                        <button className="btn btn-primary">
                            Endgame
                            <FaArrowRight />
                        </button>
                    </div>
                </div>
            </div>

            <div className="card w-full lg:w-1/2 bg-base-200 shadow-xl mt-1 h-2/3">
                <div className="card-body flex flex-col items-center">
                    <div className="w-full">
                        <div className="grid grid-cols-3 grid-rows-2">
                            <button className="btn btn-outline btn-block rounded-b-none rounded-tr-none  p-10 flex flex-col  text-lg">
                                <div><GiAmplitude className="text-3xl" /> </div>
                                Scored Amp
                            </button>

                            <button className="btn btn-outline btn-block rounded-none border-b-none p-10 flex flex-col text-xl"> 
                                <div><BsSpeakerFill className="text-3xl"/></div> 
                                Scored Speaker
                            </button>

                            <button className="btn btn-outline btn-block rounded-b-none rounded-tl-none p-10 flex flex-col text-xl">
                                <div>
                                <IoPush className="text-3xl" />
                                </div>  
                                Scored Trap
                            </button>

                            <button className="btn btn-outline btn-block rounded-t-none rounded-br-none  p-10 flex flex-col text-xl">
                            <div><MdOutlineCallMissedOutgoing className="text-3xl" /></div>
                                Missed Amp
                            </button>

                            <button className="btn btn-outline btn-block rounded-none border-b-none p-10 flex flex-col text-xl"> 
                                <div><MdOutlineCallMissedOutgoing className="text-3xl" /></div> 
                                Missed Speaker
                            </button>

                            <button className="btn btn-outline btn-block rounded-t-none rounded-bl-none p-10 flex flex-col items-center text-xl">
                                <div>
                                <MdOutlineCallMissedOutgoing className="text-3xl" />

                                </div>  
                                Missed Trap
                            </button>
                        </div>
                        
                    </div>

                    <div className="divider"></div>

                    
                </div>
            </div>
        </div>
           
    </Container>

}