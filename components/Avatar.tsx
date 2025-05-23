import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { levelToClassName } from "@/lib/Xp";
import { BsGearFill } from "react-icons/bs";

export default function Avatar(props: {
	user?: { image: string | undefined; level?: number; admin?: boolean };
	scale?: string | undefined; // Use "scale-75" for 75% scale, etc.
	imgHeightOverride?: string | undefined;
	showLevel?: boolean | undefined;
	borderThickness?: number | undefined;
	animation?: string | undefined;
	onClick?: () => void | undefined;
	className?: string | undefined;
	online?: boolean;
	gearSize?: number;
	altText?: string;
}) {
	const { session, status } = useCurrentSession();
	const user = props.user ?? session?.user;
	const image = user?.image ?? "/user.jpg";
	const levelClass = levelToClassName(user?.level);
	const admin = user?.admin;

	return (
		<div
			className={`avatar ${props.online && "online"} ${props.scale} ${props.className} ${props.animation}`}
		>
			{props.showLevel && (
				<div className="absolute bg-base-100 rounded-tl-xl rounded-br-xl h-6 w-14 text-center text-sm font-semibold">
					LVL: {user?.level}
				</div>
			)}
			<div
				className={`w-28 ${props.imgHeightOverride ?? "h-28"} rounded-xl border-${props.borderThickness ?? 4} ${levelClass}`}
			>
				<img
					src={image}
					alt={props.altText ?? "Avatar"}
					onClick={props.onClick}
				></img>
			</div>
			{admin ? (
				<div className="absolute -bottom-2 -left-2 text-slate-300 animate-spin-slow">
					<BsGearFill size={props.gearSize ?? 36}></BsGearFill>
				</div>
			) : (
				<></>
			)}
		</div>
	);
}
