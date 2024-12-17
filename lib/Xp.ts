const XP_PER_LEVEL = 20;

export function xpToLevel(xp: number) {
	return Math.floor(xp / XP_PER_LEVEL);
}

export function levelToXp(level: number) {
	return level * XP_PER_LEVEL;
}

export function xpRequiredForNextLevel(level: number) {
	return levelToXp(level + 1);
}

export function levelToClassName(level: number | undefined) {
	if (!level) {
		return "border-neutral";
	}
	let className = "border-";

	if (level >= 20) className += "primary";
	else if (level >= 15) className += "secondary";
	else if (level >= 10) className += "accent";
	else if (level >= 5) className += "error";
	else if (level >= 3) className += "warning";
	else if (level >= 1) className += "success";
	else className += "info";

	return className;
}
