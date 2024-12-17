import { ReactNode } from "react";

export type FlexProps = {
	children: ReactNode;
	className?: string | undefined;
	mode?: "col" | "row" | undefined;
	center?: boolean | undefined;
};

export default function Flex(props: FlexProps) {
	return (
		<div
			className={`w-full flex ${props.mode ? `flex-${props.mode}` : ""} ${
				props.center ? "items-center justify-center" : ""
			} ${props.className}`}
		>
			{props.children}
		</div>
	);
}
