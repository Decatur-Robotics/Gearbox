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
		<div className="text-accent m-2">
			{/* Desktop layout */}
			<div
				className={`max-sm:hidden radial-progress text-${hovered ? "xs" : "sm"}`}
				style={
					{
						"--value":
							((user.xp - xpRequiredForNextLevel(user.level - 1)) /
								(xpRequiredForNextLevel(user.level) -
									xpRequiredForNextLevel(user.level - 1))) *
							100,
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
			{/* Desktop layout */}
			<div className="sm:hidden">
				<div className="divider" />
				<div>
					Level {user.level} - XP: {user.xp}/
					{xpRequiredForNextLevel(user.level)}
				</div>
				<progress
					className="progress progress-accent"
					value={user.xp - xpRequiredForNextLevel(user.level - 1)}
					max={
						xpRequiredForNextLevel(user.level) -
						xpRequiredForNextLevel(user.level - 1)
					}
				/>
			</div>
		</div>
	);
}
