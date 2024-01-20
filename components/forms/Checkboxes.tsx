

export default function Checkbox(props: {label: string}) {
    return <label className="w-full label cursor-pointer flex flex-row justify-end space-x-8">
    <span className="label-text text-xl font-semibold ">{props.label}</span> 
    <input type="checkbox" checked={true} className="w-10 h-10 checkbox checkbox-primary" />
  </label>
}

export function IntakeType(props: {}) {
    return <div className="w-full grid grid-cols-2 grid-rows-3 items-center text-2xl">
        <span >Human Intake: </span> <input type="radio" className="radio radio-primary ml-10"/>
        <span>Ground Intake: </span> <input type="radio" className="radio radio-secondary ml-10"/>
        <span>Both: </span> <input type="radio" className="radio radio-accent ml-10"/>
    </div>
    
}