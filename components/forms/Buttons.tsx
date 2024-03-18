import { FormData } from "@/lib/Types";
export type ButtonProps = {
  data: FormData;
  callback: (key: string, value: string | number | boolean) => void;
};

export function AutoButtons(props: ButtonProps) {

  return <div className="w-full h-full flex flex-col items-center">
    <div className="w-full h-16 bg-base-300 rounded-t-xl flex flex-row font-mono border-4 border-neutral">
      <div className="w-1/2 text-md flex flex-row items-center justify-center text-center">
        <p className="">Scored: <span className="block">{props.data.AutoScoredAmp}</span></p>
        <p>Missed: <span className="block">{props.data.AutoMissedAmp}</span></p>
      </div>
      <div className="w-1/2 text-md flex flex-row items-center justify-center text-center">
        <p>Scored: <span className="block">{props.data.AutoScoredSpeaker}</span></p>
        <p>Missed: <span className="block">{props.data.AutoMissedSpeaker}</span></p>
      </div>
    </div>
    <div className="w-full h-2/3 grid grid-cols-2 grid-rows-2">
        <button onClick={() => {
            props.callback("AutoScoredAmp", props.data.AutoScoredAmp + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg">
          Scored Amp
        </button>
        <button onClick={() => {
            props.callback("AutoScoredSpeaker", props.data.AutoScoredSpeaker + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg">
          Scored Speaker
        </button>
        <button onClick={() => {
            props.callback("AutoMissedAmp", props.data.AutoMissedAmp + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg rounded-bl-xl">
          Missed Amp
        </button>
        <button onClick={() => {
            props.callback("AutoMissedSpeaker", props.data.AutoMissedSpeaker + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg rounded-br-xl">
          Missed Speaker
        </button>
        
    </div>
  </div>
}

export function TeleopButtons(props: ButtonProps) {

  return <div className="w-full h-full flex flex-col items-center">
    <div className="w-full h-16 bg-base-300 rounded-t-xl flex flex-row font-mono border-4 border-neutral">
      <div className="w-1/2 text-xs flex flex-row items-center justify-center text-center">
        <p className="">Scored: <span className="block">{props.data.TeleopScoredAmp}</span></p>
        <p>Missed: <span className="block">{props.data.TeleopMissedAmp}</span></p>
      </div>
      <div className="w-1/2 text-xs flex flex-row items-center justify-center text-center">
        <p className="">Scored: <span className="block">{props.data.TeleopScoredSpeaker}</span></p>
        <p>Missed: <span className="block">{props.data.TeleopMissedSpeaker}</span></p>
      </div>
      <div className="w-1/2 text-xs flex flex-row items-center justify-center text-center">
        <p>Scored: <span className="block">{props.data.TeleopScoredTrap}</span></p>
        <p>Missed: <span className="block">{props.data.TeleopMissedTrap}</span></p>
      </div>
    </div>
    <div className="w-full h-2/3 grid grid-cols-3 grid-rows-2">
        <button onClick={() => {
            props.callback("TeleopScoredAmp", props.data.TeleopScoredAmp + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg">
          Scored Amp
        </button>
        <button onClick={() => {
            props.callback("TeleopScoredSpeaker", props.data.TeleopScoredSpeaker + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg">
          Scored Speaker
        </button>
        <button onClick={() => {
            props.callback("TeleopScoredTrap", props.data.TeleopScoredTrap + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg">
          Scored Trap
        </button>

        <button onClick={() => {
            props.callback("TeleopMissedAmp", props.data.TeleopMissedAmp + 1);
          }} className="btn btn-outline rounded-none rounded-bl-xl w-full h-full text-lg">
          Missed Amp
        </button>
        <button onClick={() => {
            props.callback("TeleopMissedSpeaker", props.data.TeleopMissedSpeaker + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg">
          Missed Speaker
        </button>
        <button onClick={() => {
            props.callback("TeleopMissedTrap", props.data.TeleopMissedTrap + 1);
          }} className="btn btn-outline rounded-none w-full h-full text-lg rounded-br-xl">
          Missed Trap
        </button>
        
    </div>
  </div>
}

/*
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
*/