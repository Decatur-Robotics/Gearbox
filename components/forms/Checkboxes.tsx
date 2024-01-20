

export default function Checkbox(props: {label: string}) {
    return <label className="w-full label cursor-pointer flex flex-row justify-end space-x-8">
    <span className="label-text text-xl font-semibold ">{props.label}</span> 
    <input type="checkbox" checked={true} className="w-10 h-10 checkbox checkbox-primary" />
  </label>
}

export function IntakeType(props: {}) {
    return <div className="w-full flex flex-col items-center text-2xl">
        <h1 className="font-semibold text-xl mb-2">Intake Type</h1>
        <span>Human Intake: <input type="radio" className="radio radio-primary"/></span>
        <span>Ground Intake: <input type="radio" className="radio radio-secondary"/></span>
        <span>Both: <input type="radio" className="radio radio-accent"/></span>
    </div>
    
}