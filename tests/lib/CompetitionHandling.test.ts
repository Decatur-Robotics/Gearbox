import { generateSchedule } from "@/lib/CompetitionHandling";

test(`${generateSchedule.name}: Generates a schedule with the correct number of matches`, () => {
	const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
	const subjectiveScouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
	const matchCount = 10;
	const robotsPerMatch = 6;

	const schedule = generateSchedule(
		scouters,
		subjectiveScouters,
		matchCount,
		robotsPerMatch,
	);

	expect(schedule.length).toBe(matchCount);
});

test(`${generateSchedule.name}: Generates a schedule with the correct number of scouters per match`, () => {
	const scouters = [
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",
		"g",
		"h",
		"i",
		"j",
		"k",
		"l",
		"m",
		"n",
		"o",
		"p",
	];
	const subjectiveScouters = [
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",
		"g",
		"h",
		"i",
		"j",
		"k",
		"l",
		"m",
		"n",
		"o",
		"p",
	];

	const matchCount = 10;
	const robotCounts = [4, 6, 8, 10];

	for (const robotsPerMatch of robotCounts) {
		const schedule = generateSchedule(
			scouters,
			subjectiveScouters,
			matchCount,
			robotsPerMatch,
		);

		for (const match of schedule) {
			expect(match.assignedScouters.length).toBe(robotsPerMatch);
		}
	}
});

test(`${generateSchedule.name}: Rotates scouters `, () => {
	const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];

	const matchCount = 6;
	const robotsPerMatch = 6;

	const schedule = generateSchedule(scouters, [], matchCount, robotsPerMatch);

	for (let i = 1; i < matchCount; i++) {
		expect(schedule[i].assignedScouters).not.toEqual(
			schedule[i - 1].assignedScouters,
		);
	}
});

test(`${generateSchedule.name}: Assigns and rotates subjective scouters`, () => {
	const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
	const subjectiveScouters = ["a", "b", "c", "d", "e", "f", "g", "h"];

	const matchCount = subjectiveScouters.length;
	const robotsPerMatch = 6;

	const schedule = generateSchedule(
		scouters,
		subjectiveScouters,
		matchCount,
		robotsPerMatch,
	);

	for (let i = 0; i < matchCount; i++) {
		expect(schedule[i].subjectiveScouter).toBe(subjectiveScouters[i]);
	}
});

test(`${generateSchedule.name}: Does not assign user as both a scouter and a subjective scouter`, () => {
	const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
	const subjectiveScouters = ["a", "b", "c", "d", "e", "f", "g", "h"];

	const matchCount = 10;
	const robotsPerMatch = 6;

	const schedule = generateSchedule(
		scouters,
		subjectiveScouters,
		matchCount,
		robotsPerMatch,
	);

	for (const match of schedule) {
		expect(match.assignedScouters).not.toContain(match.subjectiveScouter);
	}
});
