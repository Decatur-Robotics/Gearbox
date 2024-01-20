
import { ReactNode} from "react";
import StartingPosition from "./StartingPosition";
import {AutoButtons, TeleopButtons} from "./Buttons";
import DefenseSlider from "./Sliders";
import Checkbox, { IntakeType } from "./Checkboxes";

export default function FormPage(props: {children: ReactNode; title: string}) {

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

export function AutoPage() {

    return <FormPage title="Auto">
            <StartingPosition color={"Red"}></StartingPosition>
            <AutoButtons></AutoButtons> 
    </FormPage>
}

export function TeleopPage() {

    return <FormPage title="Teleop">
            <TeleopButtons></TeleopButtons>
            <DefenseSlider></DefenseSlider>
    </FormPage>
}

export function EndPage() {

    return <FormPage title="Summary">
            <Checkbox label="Coopertition Activated"></Checkbox>

            <hr className="w-full border-slate-700 border-2"></hr>
            <Checkbox label="Climbed Stage"></Checkbox>
            <Checkbox label="Parked Stage"></Checkbox>
            <Checkbox label="Went Under Stage"></Checkbox>

            <hr className="w-full border-slate-700 border-2"></hr>
            <IntakeType></IntakeType>

            <hr className="w-full border-slate-700 border-2"></hr>
            <button className="btn btn-active btn-primary">Submit</button>

    </FormPage>
}