import { QuantData } from "@/lib/Types";
export type ButtonProps = {
  data: QuantData;
  callback: (key: string, value: string | number | boolean) => void;
};

export function IncrementButton(
  props: { dataKey: string, data: QuantData, 
    callback: (key: string, value: string | number | boolean) => void, text: string, rounded?: string }) {

  const roundTop = props.rounded?.includes("t");
  const roundBottom = props.rounded?.includes("b");

  return (
    <div className="flex flex-col h-fit" key={props.dataKey}>
      <button
        onClick={() => {
          props.callback(props.dataKey, props.data[props.dataKey] + 1);
        }}
        className={`btn btn-outline active:bg-blue-300 
          ${(roundBottom || !props.rounded) && "rounded-none"} ${roundTop && " rounded-br-none rounded-bl-none"} 
          ${roundTop && (props.rounded === "tl" ? " rounded-tr-none" : "rounded-tl-none")} w-full h-[150px] text-lg 
          ${roundTop && ` rounded-${props.rounded}-xl`}`}
      >
        {props.text}: {props.data[props.dataKey]}
      </button>
      <button onClick={() => {
          props.callback(props.dataKey, Math.max(props.data[props.dataKey] - 1, 0));
        }}
        className={`btn btn-outline active:bg-red-300 
          ${(roundTop || !props.rounded) && "rounded-none"} ${roundBottom && " rounded-tr-none rounded-tl-none"} 
          ${roundBottom && (props.rounded === "bl" ? " rounded-br-none" : "rounded-bl-none")} w-full h-[20%] 
          ${roundBottom && ` rounded-${props.rounded}-xl`}`}>
        Undo
      </button>
    </div>
  );
}

export function AutoButtons(props: ButtonProps) {
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full h-2/3 grid grid-cols-2 grid-rows-2 rounded-xl pb-1">
        <IncrementButton dataKey="AutoScoredAmp" data={props.data} callback={props.callback} text="Scored Amp" rounded="tl" />
        <IncrementButton dataKey="AutoScoredSpeaker" data={props.data} callback={props.callback} text="Scored Speaker" rounded="tr" />
        <IncrementButton dataKey="AutoMissedAmp" data={props.data} callback={props.callback} text="Missed Amp" rounded="bl" />
        <IncrementButton dataKey="AutoMissedSpeaker" data={props.data} callback={props.callback} text="Missed Speaker" rounded="br" />
      </div>
    </div>
  );
}

export function TeleopButtons(props: ButtonProps) {
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full h-2/3 grid grid-cols-3 grid-rows-2 mt-4">
        <IncrementButton dataKey="TeleopScoredAmp" data={props.data} callback={props.callback} text="Scored Amp" rounded="tl" />
        <IncrementButton dataKey="TeleopScoredSpeaker" data={props.data} callback={props.callback} text="Scored Speaker" />
        <IncrementButton dataKey="TeleopScoredTrap" data={props.data} callback={props.callback} text="Scored Trap" rounded="tr" />
        <IncrementButton dataKey="TeleopMissedAmp" data={props.data} callback={props.callback} text="Missed Amp" rounded="bl" />
        <IncrementButton dataKey="TeleopMissedSpeaker" data={props.data} callback={props.callback} text="Missed Speaker" />
        <IncrementButton dataKey="TeleopMissedTrap" data={props.data} callback={props.callback} text="Missed Trap" rounded="br" />
      </div>
    </div>
  );
}
