import { FormData, IntakeTypes } from "@/lib/Types";
export type CheckboxProps = {label: string, dataKey: string, data: FormData, callback: (key: string, value: string | number | boolean) => void};
export type RadioProps = { data: FormData, callback: (key: string, value: string | number | boolean) => void};
export default function Checkbox(props: CheckboxProps) {
    //@ts-expect-error
    const checked = props.data[props.dataKey];
    return <label className="w-full label cursor-pointer flex flex-row justify-end space-x-8">
    <span className="label-text text-xl font-semibold ">{props.label}</span>
    
    <input type="checkbox" onChange={()=>{props.callback(props.dataKey, !checked)}} checked={checked} className="w-10 h-10 checkbox checkbox-primary" />
  </label>
}

export function IntakeType(props: RadioProps) {
    return <div className="w-full grid grid-cols-2 grid-rows-3 items-center text-2xl">
        <span >Human Intake: </span> <input type="radio" className="radio radio-primary ml-10" onClick={()=>{props.callback("IntakeType", IntakeTypes.Human)}} checked={props.data.IntakeType===IntakeTypes.Human}/>
        <span>Ground Intake: </span> <input type="radio" className="radio radio-secondary ml-10"  onClick={()=>{props.callback("IntakeType", IntakeTypes.Ground)}} checked={props.data.IntakeType===IntakeTypes.Ground}/>
        <span>Both: </span> <input type="radio" className="radio radio-accent ml-10"  onClick={()=>{props.callback("IntakeType", IntakeTypes.Both)}} checked={props.data.IntakeType===IntakeTypes.Both}/>
    </div>
    
} 