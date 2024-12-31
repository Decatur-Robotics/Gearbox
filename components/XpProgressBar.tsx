import { User } from "@/lib/Types";
import { xpRequiredForNextLevel } from "@/lib/Xp";
import { useState } from "react";

export default function XpProgressBar({
	user,
	size,
}: {
	user: User;
	size: string;
}) {
	const [hovered, setHovered] = useState(false);

	return (
		<div
			className={`radial-progress text-accent m-2 text-${hovered ? "xs" : "sm"}`}
			style={
				{
					"--value": (user.xp / xpRequiredForNextLevel(user.level)) * 100,
					"--size": size,
				} as any
			}
			role="progressbar"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{hovered
				? `${user.xp}/${xpRequiredForNextLevel(user.level)}`
				: `Lvl ${user.level}`}
		</div>
	);
}
