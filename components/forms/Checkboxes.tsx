import { QuantData, Pitreport } from "@/lib/Types";
import { Crescendo } from "@/lib/games";
export type CheckboxProps = {
  label: string;
  dataKey: string;
  data: QuantData | Pitreport;
  callback: (key: string, value: string | number | boolean) => void;
  divider?: boolean;
};
export type RadioProps = {
  data: QuantData | Pitreport;
  callback: (key: string, value: string | number | boolean) => void;
};

export default function Checkbox(props: CheckboxProps) {
  console.log("Props:", props);
  const checked = "data" in props.data ? props.data.data?.[props.dataKey] : props.data?.[props.dataKey];
  console.log(`Loaded checkbox ${props.dataKey} with value ${checked} (PitReport: ${props.data instanceof Pitreport})`);

  return (
    <label className={`w-5/6 label cursor-pointer flex flex-row space-x-8 ${props.divider && "border-b-2 border-slate-600"}`}>
      <span className="w-2/3 label-text text-lg font-semibold ">
        {props.label}
      </span>

      <input
        type="checkbox"
        onChange={() => {
          console.log(props.dataKey, !checked);
          props.callback(props.dataKey, !checked);
        }}
        checked={checked}
        className="w-8 h-8 checkbox checkbox-primary"
      />
    </label>
  );
}