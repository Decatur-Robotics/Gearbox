import { Drivetrain, FormData, IntakeTypes, Pitreport } from "@/lib/Types";
export type CheckboxProps = {
  label: string;
  dataKey: string;
  data: FormData | Pitreport;
  callback: (key: string, value: string | number | boolean) => void;
};
export type RadioProps = {
  data: FormData | Pitreport;
  callback: (key: string, value: string | number | boolean) => void;
};
export default function Checkbox(props: CheckboxProps) {
  //@ts-expect-error
  const checked = props.data[props.dataKey];
  return (
    <label className="w-5/6 label cursor-pointer flex flex-row space-x-8  border-b-2 border-slate-600">
      <span className="w-2/3 label-text text-lg font-semibold ">
        {props.label}
      </span>

      <input
        type="checkbox"
        onChange={() => {
          props.callback(props.dataKey, !checked);
        }}
        checked={checked}
        className="w-8 h-8 checkbox checkbox-primary"
      />
    </label>
  );
}

export function IntakeType(props: RadioProps) {
  return (
    <div className="w-full grid grid-cols-2 grid-rows-4 align-left  text-md md:text-xl">
      <span>No Intake: </span>
      <input
        type="radio"
        className="radio radio-primary ml-10"
        onClick={() => {
          props.callback("intakeType", IntakeTypes.None);
        }}
        checked={props.data.intakeType === IntakeTypes.None}
      />
      <span>Human: </span>
      <input
        type="radio"
        className="radio radio-primary ml-10"
        onClick={() => {
          props.callback("intakeType", IntakeTypes.Human);
        }}
        checked={props.data.intakeType === IntakeTypes.Human}
      />
      <span>Ground Intake: </span>
      <input
        type="radio"
        className="radio radio-secondary ml-10"
        onClick={() => {
          props.callback("intakeType", IntakeTypes.Ground);
        }}
        checked={props.data.intakeType === IntakeTypes.Ground}
      />
      <span>Both: </span>
      <input
        type="radio"
        className="radio radio-accent ml-10"
        onClick={() => {
          props.callback("intakeType", IntakeTypes.Both);
        }}
        checked={props.data.intakeType === IntakeTypes.Both}
      />
    </div>
  );
}

export function DrivetrainType(props: RadioProps) {
  return (
    <div className="w-full grid grid-cols-2 grid-rows-3 max-sm:gap-1 text-md md:text-xl">
      <span>Tank Drive: </span>
      <input
        type="radio"
        className="radio radio-primary ml-10"
        onClick={() => {
          props.callback("drivetrain", Drivetrain.Tank);
        }}
        checked={props.data.drivetrain === Drivetrain.Tank}
      />
      <span>Mecanum Drive: </span>
      <input
        type="radio"
        className="radio radio-primary ml-10"
        onClick={() => {
          props.callback("drivetrain", Drivetrain.Mecanum);
        }}
        checked={props.data.drivetrain === Drivetrain.Mecanum}
      />
      <span>Swerve Drive: </span>
      <input
        type="radio"
        className="radio radio-secondary ml-10"
        onClick={() => {
          props.callback("drivetrain", Drivetrain.Swerve);
        }}
        checked={props.data.drivetrain === Drivetrain.Swerve}
      />
    </div>
  );
}
