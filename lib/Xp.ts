/**
 * Use the /dev/leveling page to visualize these functions. Be sure to update MAX_LEVEL in that file!
 *
 * @tested_by /lib/Xp.test.ts
 */

export const XP_PER_LEVEL = 20;

export function xpToLevel(xp: number) {
	if (xp < 0) return 0;
	return Math.floor(xp / XP_PER_LEVEL);
}

export function levelToXp(level: number) {
	if (level < 0) return 0;
	return level * XP_PER_LEVEL;
}

export function xpRequiredForNextLevel(level: number) {
	return Math.max(levelToXp(level + 1), 0);
}

export function levelToClassName(level: number | undefined) {
	if (!level) {
		return "border-neutral";
	}

	const classes: string[] = [];

	if (level >= 120)
		classes.push(
			"border-accent hover:border-primary drop-shadow-glowAccent animate-pulse",
		);
	else if (level >= 90)
		classes.push("border-accent hover:border-primary drop-shadow-glowAccent");
	else if (level >= 70)
		classes.push("border-primary hover:border-accent drop-shadow-glowStrong");
	else if (level >= 40) classes.push("border-accent hover:border-primary");
	else if (level >= 30) classes.push("border-accent");
	else if (level >= 10) classes.push("border-primary");

	return classes.join(" ");
}
