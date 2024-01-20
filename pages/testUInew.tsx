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
        <div className="w-full flex flex-col items-center space-y-5">
        
            <main className="w-full h-full flex-1 flex flex-col items-center">
                <div className="card h-[650px] w-full bg-base-200 mt-2">
                    <div className="card-body h-full w-full">
                        <div className="flex flex-col w-full h-full  items-center justify-center">
                            <div className="h-1/3 w-full flex flex-row">
                                <button className="btn btn-outline rounded-none rounded-tl-xl w-1/3 h-full text-lg">
                                    <GiAmplitude size={60} />
                                    Scored Amp
                                </button>
                                <button className="btn btn-outline rounded-none w-1/3 h-full text-lg">
                                    <BsSpeakerFill size={60} />
                                    Scored Speaker
                                </button>
                                <button className="btn btn-outline rounded-none rounded-tr-xl w-1/3 h-full text-lg">
                                    <IoPush size={60} />
                                    Scored Trap
                                </button>
                            </div>

                            <div className="h-1/3 w-full flex flex-row">
                                <button className="btn btn-outline rounded-none rounded-bl-xl w-1/3 h-full text-lg">
                                    <MdOutlineCallMissedOutgoing size={60} />
                                    Missed Amp
                                </button>
                                <button className="btn btn-outline rounded-none w-1/3 h-full text-lg">
                                <MdOutlineCallMissedOutgoing size={60} />
                                    Missed Speaker
                                </button>
                                <button className="btn btn-outline rounded-none rounded-br-xl w-1/3 h-full text-lg">
                                    <MdOutlineCallMissedOutgoing size={60} />
                                    Missed Trap
                                </button>
                            </div>
                        </div>

                        <div className="w-full h-1/3 text-center">
                            <h1 className="text-xl font-bold mb-2">Defense</h1>
                            <input type="range" min={0} max={2} value={1} className="range range-primary" step="1" />
                            <div className="w-full flex justify-between text-lg px-2">
                                <span>None</span>
                                <span>Partial</span>
                                <span>Full</span>
                                
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <footer className="w-full">
                <div className="card w-full bg-base-200">
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
            </footer>
    </div>

           
    </Container>

}