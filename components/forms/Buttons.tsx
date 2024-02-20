import { FormData } from "@/lib/Types";
export type ButtonProps = {
  data: FormData;
  callback: (key: string, value: string | number | boolean) => void;
};

export function AutoButtons(props: ButtonProps) {
  return (
    <div className="flex flex-col w-full h-1/3 items-center justify-center">
      <div className="h-1/2 w-full flex flex-row">
        <button
          onClick={() => {
            props.callback("AutoScoredAmp", props.data.AutoScoredAmp + 1);
          }}
          className="btn btn-outline rounded-none rounded-tl-xl w-1/2 h-full text-lg"
        >
          Scored Amp
        </button>
        <button
          onClick={() => {
            props.callback(
              "AutoScoredSpeaker",
              props.data.AutoScoredSpeaker + 1,
            );
          }}
          className="btn btn-outline rounded-none rounded-tr-xl w-1/2 h-full text-lg"
        >
          Scored Speaker
        </button>
      </div>

      <div className="h-1/2 w-full flex flex-row">
        <button
          onClick={() => {
            props.callback("AutoMissedAmp", props.data.AutoMissedAmp + 1);
          }}
          className="btn btn-outline rounded-none rounded-bl-xl w-1/2 h-full text-lg"
        >
          Missed Amp
        </button>
        <button
          onClick={() => {
            props.callback("AutoMissedSpeaker", props.data.AutoMissedAmp + 1);
          }}
          className="btn btn-outline rounded-none rounded-br-xl w-1/2 h-full text-lg"
        >
          Missed Speaker
        </button>
      </div>
    </div>
  );
}

export function TeleopButtons(props: ButtonProps) {
  return (
    <div className="flex flex-col w-full h-1/2 items-center justify-center">
      <div className="h-1/2 w-full flex flex-row">
        <button
          onClick={() => {
            props.callback("TeleopScoredAmp", props.data.TeleopScoredAmp + 1);
          }}
          className="btn btn-outline rounded-none rounded-tl-xl w-1/3 h-full text-lg"
        >
          Scored Amp
        </button>
        <button
          onClick={() => {
            props.callback(
              "TeleopScoredSpeaker",
              props.data.TeleopScoredSpeaker + 1,
            );
          }}
          className="btn btn-outline rounded-none  w-1/3 h-full text-lg"
        >
          Scored Speaker
        </button>
        <button
          onClick={() => {
            props.callback("TeleopScoredTrap", props.data.TeleopScoredTrap + 1);
          }}
          className="btn btn-outline rounded-none rounded-tr-xl w-1/3 h-full text-lg"
        >
          Scored Trap
        </button>
      </div>

      <div className="h-1/2 w-full flex flex-row">
        <button
          onClick={() => {
            props.callback("TeleopMissedAmp", props.data.TeleopMissedAmp + 1);
          }}
          className="btn btn-outline rounded-none rounded-bl-xl w-1/3 h-full text-lg"
        >
          Missed Amp
        </button>
        <button
          onClick={() => {
            props.callback(
              "TeleopMissedSpaaker",
              props.data.TeleopMissedSpeaker + 1,
            );
          }}
          className="btn btn-outline rounded-none  w-1/3 h-full text-lg"
        >
          Missed Speaker
        </button>
        <button
          onClick={() => {
            props.callback("TeleopMissedTrap", props.data.TeleopMissedTrap + 1);
          }}
          className="btn btn-outline rounded-none rounded-br-xl w-1/3 h-full text-lg"
        >
          Missed Trap
        </button>
      </div>
    </div>
  );
}
