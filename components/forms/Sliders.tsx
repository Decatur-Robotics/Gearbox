import { QuantitativeFormData, Defense } from "@/lib/Types";

export type SliderProps = {
  data: QuantitativeFormData;
  callback: (key: string, value: string | number | boolean) => void;
  possibleValues: { [key: string]: any };
  title: string;
  value: any;
  key: keyof QuantitativeFormData;
};
export default function Slider(props: SliderProps) {
  const keys = Object.keys(props.possibleValues);
  const num = keys.indexOf(props.value);

  return (
    <div className="w-full text-center">
      <h1 className="font-semibold text-xl mb-2">{props.title}</h1>
      <input
        onChange={(e) => {
          props.callback(props.key as string, keys[e.target.valueAsNumber]);
        }}
        type="range"
        min={0}
        max={keys.length - 1}
        value={num}
        className="range range-primary"
        step="1"
      />
      <div className="w-full flex justify-between text-lg px-2 text-center">
        {
          keys.map((key, i) => {
            return (
              <span key={i}>
                {key}
              </span>
            );
          })
        }
      </div>
    </div>
  );
}
