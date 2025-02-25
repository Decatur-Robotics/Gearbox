import {
	levelToXp,
	XP_PER_LEVEL,
	xpRequiredForNextLevel,
	xpToLevel,
} from "@/lib/Xp";

describe(xpToLevel.name, () => {
	test("0 XP is level 0", () => {
		expect(xpToLevel(0)).toBe(0);
	});

	test("Positive XP returns correct level", () => {
		const testCases: [number, number][] = [];

		for (let i = 0; i < 1000; i++) {
			testCases.push([i * XP_PER_LEVEL, i]);
		}

		testCases.forEach(([xp, level]) => {
			expect(xpToLevel(xp)).toBe(level);
		});
	});

	test("Negative XP is level 0", () => {
		for (let i = 1; i < 1000; i++) {
			expect(xpToLevel(-i)).toBe(0);
		}
	});
});

describe(levelToXp.name, () => {
	test("0 level is 0 XP", () => {
		expect(levelToXp(0)).toBe(0);
	});

	test("Positive level returns correct XP", () => {
		const testCases: [number, number][] = [];

		for (let i = 0; i < 1000; i++) {
			testCases.push([i, i * XP_PER_LEVEL]);
		}

		testCases.forEach(([level, xp]) => {
			expect(levelToXp(level)).toBe(xp);
		});
	});

	test("Negative level is 0 XP", () => {
		for (let i = 1; i < 1000; i++) {
			expect(levelToXp(-i)).toBe(0);
		}
	});
});

describe(xpRequiredForNextLevel.name, () => {
	test("0 level requires correct XP", () => {
		expect(xpRequiredForNextLevel(0)).toBe(XP_PER_LEVEL);
	});

	test("Positive level returns correct XP", () => {
		const testCases: [number, number][] = [];

		for (let i = 0; i < 1000; i++) {
			testCases.push([i, (i + 1) * XP_PER_LEVEL]);
		}

		testCases.forEach(([level, xp]) => {
			expect(xpRequiredForNextLevel(level)).toBe(xp);
		});
	});

	test("Negative level is 0 XP", () => {
		for (let i = 1; i < 1000; i++) {
			expect(xpRequiredForNextLevel(-i)).toBe(0);
		}
	});
});
