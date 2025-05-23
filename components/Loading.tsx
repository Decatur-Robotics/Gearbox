import { BsGearFill } from "react-icons/bs";

export default function Loading(props: {
	size?: number;
	className?: string;
	bg?: string;
	fill?: string;
}) {
	return (
		<div
			className={`w-full h-full flex items-center justify-center ${props.bg ?? "skeleton"} ${props.className}`}
		>
			<BsGearFill
				size={props.size ?? 64}
				className={`${props.fill ?? "text-white"} animate-spin-slow`}
			/>
		</div>
	);
}
