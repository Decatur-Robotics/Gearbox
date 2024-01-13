import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { FaBolt, FaMicrophone, FaRobot } from "react-icons/fa";
import { GiAmplitude, GiRobotGrab } from "react-icons/gi";
import { BsSpeakerFill } from "react-icons/bs";

import { useState } from "react";
import { IoPush } from "react-icons/io5";

const AmpDuration = 10*1000;

export default function Homepage() {

    const { session, status } = useCurrentSession();

    const hide = status === "authenticated";

    const[amped, setAmped] = useState(false);
    const[ampTime, setAmpTime] = useState(AmpDuration);
    
    const ampUp = () => {
        setAmped(true);
        setAmpTime(AmpDuration);
        var start = Date.now();
        var interval = setInterval(() => {
         
           let delta = (Date.now()-start);
           let val = AmpDuration-delta;
           if(val <= 0) {
            clearInterval(interval);
            setAmped(false);
            return;
           }
           setAmpTime(AmpDuration-delta);
        }, 10);
    }

    const [climbedRobots, setClimbedRobots] = useState(0);
    const [climbed, setClimbed] = useState(false);

    const modifyClimbedRobots = (pos:number) => {
        if(pos === climbedRobots) {
            setClimbedRobots(0);
        } else {
            setClimbedRobots(pos);
        } 
    }
    
    return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full flex flex-col items-center">

            <div className="card w-full lg:w-1/2 bg-base-300 mt-2 mb-1">
                <div className="card-body flex flex-col items-center">
                    
                    <h1 className="font-bold text-blue-500 text-5xl relative -top-4">#4026</h1>

                    <div role="tablist" className="tabs tabs-boxed w-11/12 flex flex-row justify-between">
                            <a role="tab" className="tab w-1/3">Auto</a>
                            <a role="tab" className="tab tab-active w-1/3">Teleop</a>
                            <a role="tab" className="tab w-1/3">Submit</a>
                        </div>

                    <div className="card-actions justify-between w-full">
                        
                    </div>
                </div>
            </div>


            {amped ? <div className="w-full lg:w-1/2 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-primary h-2.5 rounded-full drop-shadow-glowStrong" style={{width: `${(ampTime/AmpDuration)*100}%`}}></div>
                    </div>: <progress className="progress w-full"></progress>
            }

            <div className="card w-full lg:w-1/2 bg-base-300 shadow-xl mt-1 pb-2">
                <div className="card-body flex flex-col items-center">

                    <h1 className="text-3xl font-bold">Teleop</h1>

                    <button className={`btn ${amped ? "btn-disabled" : "btn-active"} btn-primary btn-wide drop-shadow-glowWeak text-xl mt-4`} onClick={ampUp}><FaBolt /> {amped ? "Amped": "Amp Up"}</button>
                    <button className={`btn btn-active btn-primary btn-wide  text-xl mt-2`} onClick={()=>{}}><GiAmplitude className="text-3xl" /> Scored Amp</button>
                    <button className={`btn btn-active btn-primary btn-wide ${amped ? "drop-shadow-glowStrong" : ""} text-xl mt-2`}><BsSpeakerFill /> Scored Speaker </button>

                    <div className="divider"></div>

                    <h1 className="text-3xl font-bold">Endgame</h1>
                    
                    <div className="w-3/4 flex flex-row justify-between items-center mt-2">
                        
                        <h1 className="text-2xl font-bold"> <GiRobotGrab className="inline relative -top-1" /> Climbed</h1>
                        <input type="checkbox" className="toggle toggle-primary" checked={climbed} onChange={()=>{setClimbed((prev)=>!prev)}}/>
                    </div>

                    <div className="w-3/4 flex flex-row justify-between items-center">
                        
                        <h1 className="text-2xl font-bold"> <FaMicrophone className="inline relative -top-1" /> Microphone</h1>
                        <input type="checkbox" className="toggle toggle-primary" checked={climbed} onChange={()=>{setClimbed((prev)=>!prev)}}/>
                    </div>

                    <button className={`btn btn-active btn-primary btn-wide  text-xl mt-2`} onClick={()=>{}}><IoPush className="text-3xl" /> Scored Trap</button>

                    <h1 className="text-xl font-bold mt-3">Robots on Stage</h1>
                    <div className="rating gap-1">
                        <button className={`btn btn-ghost ${climbedRobots >= 1 ? "" : "opacity-20"} h-fit`} onClick={()=>{modifyClimbedRobots(1)}}><FaRobot size={60}></FaRobot></button>
                        <button className={`btn btn-ghost ${climbedRobots >= 2 ? "" : "opacity-20"} h-fit`} onClick={()=>{modifyClimbedRobots(2)}}><FaRobot size={60}></FaRobot></button>
                        <button className={`btn btn-ghost ${climbedRobots == 3 ? "" : "opacity-20"} h-fit`} onClick={()=>{modifyClimbedRobots(3)}}><FaRobot size={60}></FaRobot></button>
                    </div>

                </div>
            </div>
        </div>
           
    </Container>

}