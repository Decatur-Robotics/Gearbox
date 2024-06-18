import { QuantitativeFormData, Defense } from "@/lib/Types";

export type SliderProps = {
  data: QuantitativeFormData;
  callback: (key: string, value: string | number | boolean) => void;
};
export default function DefenseSlider(props: SliderProps) {
  const keys = Object.keys(Defense);
  const num = keys.indexOf(props.data.Defense);

  return (
    <div className="w-full text-center">
      <h1 className="font-semibold text-xl mb-2">Defense</h1>
      <input
        onChange={(e) => {
          props.callback("Defense", keys[e.target.valueAsNumber]);
        }}
        type="range"
        min={0}
        max="2"
        value={num}
        className="range range-primary"
        step="1"
      />
      <div className="w-full flex justify-between text-lg px-2 text-center">
        <span>None</span>
        <span>Partial</span>
        <span>Full</span>
      </div>
    </div>
  );
}
