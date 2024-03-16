import { ReactNode } from "react";
import StartingPosition from "./StartingPosition";
import { AutoButtons, TeleopButtons } from "./Buttons";
import DefenseSlider from "./Sliders";
import Checkbox, { IntakeType } from "./Checkboxes";
import { AllianceColor, FormData } from "@/lib/Types";
import { CommentBox } from "./Comment";

export type PageProps = {
  alliance: AllianceColor;
  data: FormData;
  callback: (key: string, value: string | number | boolean) => void;
};
export type EndPageProps = {
  alliance: AllianceColor;
  data: FormData;
  submit: () => void;
  callback: (key: string, value: string | number | boolean) => void;
};

export default function FormPage(props: {
  children: ReactNode;
  title: string;
}) {
  return (
    <main className="w-full h-full flex-1">
      <div className="card h-[650px] w-full bg-base-200 mt-2">
        <div className="card-body h-full w-full flex flex-col items-center">
          <h1 className="text-5xl font-bold">{props.title}</h1>
          <hr className="w-2/3 border-slate-700 border-2"></hr>
          <div className="h-full flex flex-col items-center justify-center space-y-2">
            {props.children}
          </div>
        </div>
      </div>
    </main>
  );
}

export function PrematchPage(props: PageProps) {
  return <FormPage title="Pre-match">
    <Checkbox
        label="Climbed Stage"
        dataKey="ClimbedStage"
        data={props.data}
        callback={props.callback}
      ></Checkbox>
  </FormPage>
}

export function AutoPage(props: PageProps) {
  return (
    <FormPage title="Auto">
      <StartingPosition
        alliance={props.alliance}
        data={props.data}
        callback={props.callback}
      ></StartingPosition>
      <AutoButtons data={props.data} callback={props.callback}></AutoButtons>
    </FormPage>
  );
}

export function TeleopPage(props: PageProps) {
  return (
    <FormPage title="Teleop">
      <TeleopButtons
        data={props.data}
        callback={props.callback}
      ></TeleopButtons>
      <DefenseSlider
        data={props.data}
        callback={props.callback}
      ></DefenseSlider>
    </FormPage>
  );
}

export function EndPage(props: EndPageProps) {
  return (
    <FormPage title="Summary">
      <Checkbox
        label="Coopertition Activated"
        dataKey="Coopertition"
        data={props.data}
        callback={props.callback}
      ></Checkbox>

      <hr className="w-full border-slate-700 border-2"></hr>
      <Checkbox
        label="Climbed Stage"
        dataKey="ClimbedStage"
        data={props.data}
        callback={props.callback}
      ></Checkbox>
      <Checkbox
        label="Parked Stage"
        dataKey="ParkedStage"
        data={props.data}
        callback={props.callback}
      ></Checkbox>
      <Checkbox
        label="Went Under Stage"
        dataKey="UnderStage"
        data={props.data}
        callback={props.callback}
      ></Checkbox>

      <hr className="w-full border-slate-700 border-2"></hr>
      <IntakeType data={props.data} callback={props.callback}></IntakeType>

      <CommentBox data={props.data} callback={props.callback}></CommentBox>
      <hr className="w-full border-slate-700 border-2"></hr>
      <button className="btn btn-wide btn-primary " onClick={props.submit}>
        Submit
      </button>
    </FormPage>
  );
}
