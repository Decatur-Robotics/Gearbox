import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { FaArrowRight, FaArrowLeft, FaCube } from "react-icons/fa";
import { BsCone, BsSpeakerFill } from "react-icons/bs";
import { MdOutlineCallMissedOutgoing } from "react-icons/md";
import { GiAmplitude } from "react-icons/gi";
import { IoPush } from "react-icons/io5";
import { ReactNode, useState } from "react";

import p5Types from "p5";

import dynamic from 'next/dynamic';
import { AllianceColor } from "@/lib/Types";

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
    ssr: false,
});


var bg: p5Types.Image;
var dropped = false;
var angled = false;
var mx = 0;
var my = 0;

var ax = 0;
var ay = 0;
var a = 0;
function StartingPosition(props: {color: AllianceColor}) {

    const setup = (p5: p5Types, canvasParentRef: Element) => {
        bg = p5.loadImage(props.color === AllianceColor.Blue ? "/croppedFieldBlue.PNG": "/croppedFieldRed.PNG");
        const ctx = p5.createCanvas(350, 300).parent(canvasParentRef);
        ctx.mousePressed(() => {
            if(!dropped) {
                dropped = true;
                angled = false;
                mx = p5.mouseX;
                my = p5.mouseY;
            } else {
                dropped = false;
                angled = true;
                ax = p5.mouseX;
                ay = p5.mouseY;
            }
            
        });
        p5.rectMode(p5.CENTER);
    };
    
    const draw = (p5: p5Types) => {
        p5.background(bg);
        p5.stroke("black")
        p5.strokeWeight(1);
        p5.fill("lightgrey");
        if(dropped || angled) {
            p5.translate(mx, my)
            
            a = p5.atan2(ay - my, ax - mx);
            p5.rotate(a);
            p5.rect(0, 0, 35, 35, 10);
            p5.fill("black")
            p5.rect(12.5, 15, 10, 5, 3);
            p5.rect(12.5, -15, 10, 5, 3);
            p5.rect(-12.5, 15, 10, 5, 3);
            p5.rect(-12.5, -15, 10, 5, 3);

            p5.stroke("red")
            p5.strokeWeight(3);
            p5.line(0,0, 35, 0);

        }
    };

    return <div className="overflow-hidden rounded-3xl w-fit h-fit">
                < Sketch setup={setup} draw={draw} />
            </div>
}

function AutoButtons(props: {}) {
    return <div className="flex flex-col w-full h-1/3 items-center justify-center">
                <div className="h-1/2 w-full flex flex-row text-md">
                    <button className="btn btn-outline rounded-none rounded-tl-xl w-1/2 h-full">Scored Speaker</button>
                    <button className="btn btn-outline rounded-none rounded-tr-xl w-1/2 h-full py-4">Scored Speaker</button>
                </div>

                <div className="h-1/2 w-full flex flex-row">
                    <button className="btn btn-outline rounded-none rounded-bl-xl w-1/2 h-full">Missed Amp</button>
                    <button className="btn btn-outline rounded-none rounded-br-xl w-1/2 h-full">Missed Speaker</button>
                </div>
    </div>
             
}


function FormPage(props: {children: ReactNode; title: string}) {

    return ( <main className="w-full h-full flex-1">
        <div className="card h-[650px] w-full bg-base-200 mt-2">
            <div className="card-body h-full w-full flex flex-col items-center">
                <h1 className="text-5xl font-bold">{props.title}</h1>
                <hr className="w-2/3 border-slate-700 border-2"></hr>
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                    {props.children}
                </div>
            </div>
        </div>
    </main> )
}



function AutoPage() {

    return <FormPage title="Auto">

                <StartingPosition color={AllianceColor.Blue}></StartingPosition>
                <AutoButtons></AutoButtons> 
    </FormPage>
}

export default function Homepage() {

    const { session, status } = useCurrentSession();

    const hide = status === "authenticated";

    return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full flex flex-col items-center space-y-2">
        
            <AutoPage></AutoPage>
            
            <footer className="w-full">
                <div className="card w-full bg-base-200">
                    <div className="card-body flex flex-col items-center">
                        

                        <div className="card-actions justify-between w-full">
                            <button className="btn btn-primary">
                                <FaArrowLeft />
                                Auto
                            </button>
                            <h2 className=" text-blue-500 font-bold text-5xl">#4026</h2>

                            <button className="btn btn-primary">
                                End
                                <FaArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
    </div>

           
    </Container>

}