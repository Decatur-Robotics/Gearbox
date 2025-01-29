import { QuantData } from "@/lib/Types";
export type ButtonProps = {
	data: QuantData;
	callback: (key: string, value: string | number | boolean) => void;
};

export function IncrementButton(props: {
	dataKey: string;
	data: QuantData;
	callback: (key: string, value: string | number | boolean) => void;
	text: string;
	topRounding?: string;
	bottomRounding?: string;
}) {
	function getRounding(rounding: string | undefined) {
		let finalRounding = "";

		if (rounding === "t") finalRounding = "rounded-b-none";
		else if (rounding === "b") finalRounding = "rounded-t-none";
		else if (rounding === "l") finalRounding = "rounded-r-none";
		else if (rounding === "r") finalRounding = "rounded-l-none";

		if (rounding === "tl")
			finalRounding = "rounded-tr-none rounded-bl-none rounded-br-none";
		else if (rounding === "tr")
			finalRounding = "rounded-tl-none rounded-bl-none rounded-br-none";
		else if (rounding === "bl")
			finalRounding = "rounded-tl-none rounded-tr-none rounded-br-none";
		else if (rounding === "br")
			finalRounding = "rounded-tl-none rounded-tr-none rounded-bl-none";

		if (rounding?.length === 0) finalRounding = "rounded-none";

		return finalRounding;
	}

	return (
		<div
			className="flex flex-col h-fit"
			key={props.dataKey}
		>
			<button
				onClick={() => {
					props.callback(props.dataKey, props.data[props.dataKey] + 1);
				}}
				className={`btn btn-outline active:bg-blue-300 h-24 ${getRounding(props.topRounding)}`}
			>
				{props.text}: {props.data[props.dataKey]}
			</button>
			<button
				onClick={() => {
					props.callback(
						props.dataKey,
						Math.max(props.data[props.dataKey] - 1, 0),
					);
				}}
				className={`btn btn-outline active:bg-red-300 h-4 ${getRounding(props.bottomRounding)}`}
			>
				Undo
			</button>
		</div>
	);
}

export function AutoButtons(props: ButtonProps) {
	return (
		<div className="w-full h-full flex flex-col items-center">
			<div className="w-full h-2/3 grid grid-cols-2 grid-rows-2 rounded-xl pb-1">
				<IncrementButton
					dataKey="AutoScoredAmp"
					data={props.data}
					callback={props.callback}
					text="Scored Amp"
					topRounding="tl"
				/>
				<IncrementButton
					dataKey="AutoScoredSpeaker"
					data={props.data}
					callback={props.callback}
					text="Scored Speaker"
					topRounding="tr"
				/>
				<IncrementButton
					dataKey="AutoMissedAmp"
					data={props.data}
					callback={props.callback}
					text="Missed Amp"
					bottomRounding="bl"
				/>
				<IncrementButton
					dataKey="AutoMissedSpeaker"
					data={props.data}
					callback={props.callback}
					text="Missed Speaker"
					bottomRounding="br"
				/>
			</div>
		</div>
	);
}

export function TeleopButtons(props: ButtonProps) {
	return (
		<div className="w-full h-full flex flex-col items-center">
			<div className="w-full h-2/3 grid grid-cols-3 grid-rows-2 mt-4">
				<IncrementButton
					dataKey="TeleopScoredAmp"
					data={props.data}
					callback={props.callback}
					text="Scored Amp"
					topRounding="tl"
				/>
				<IncrementButton
					dataKey="TeleopScoredSpeaker"
					data={props.data}
					callback={props.callback}
					text="Scored Speaker"
				/>
				<IncrementButton
					dataKey="TeleopScoredTrap"
					data={props.data}
					callback={props.callback}
					text="Scored Trap"
					topRounding="tr"
				/>
				<IncrementButton
					dataKey="TeleopMissedAmp"
					data={props.data}
					callback={props.callback}
					text="Missed Amp"
					bottomRounding="bl"
				/>
				<IncrementButton
					dataKey="TeleopMissedSpeaker"
					data={props.data}
					callback={props.callback}
					text="Missed Speaker"
				/>
				<IncrementButton
					dataKey="TeleopMissedTrap"
					data={props.data}
					callback={props.callback}
					text="Missed Trap"
					bottomRounding="br"
				/>
			</div>
		</div>
	);
}
