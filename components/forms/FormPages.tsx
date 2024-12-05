import { ReactNode } from "react";
import { AllianceColor, QuantData } from "@/lib/Types";

export type PageProps = {
	alliance: AllianceColor;
	data: QuantData;
	callback: (key: string, value: string | number | boolean) => void;
	fieldImagePrefix?: string;
};

export type EndPageProps = {
	alliance: AllianceColor;
	data: QuantData;
	submit: () => void;
	callback: (key: string, value: string | number | boolean) => void;
};

export default function FormPage(props: {
	children: ReactNode;
	title: string;
}) {
	return (
		<main className="w-full h-full flex-1">
			<div className={`card w-full h-[650px] bg-base-200 mt-2`}>
				<div className="card-body h-full w-full flex flex-col items-center">
					<h1 className="text-5xl font-bold">{props.title}</h1>
					<hr className="w-2/3 border-slate-700 border-2"></hr>
					<div className="h-full flex flex-col items-center justify-center space-y-2">
						{props.children}
					</div>
				</div>
			</div>
		</main>
	);
}
