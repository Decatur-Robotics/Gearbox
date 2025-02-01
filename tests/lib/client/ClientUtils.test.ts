import {
	camelCaseToTitleCase,
	promisify,
	removeDuplicates,
	removeWhitespaceAndMakeLowerCase,
	rotateArray,
	toDict,
	wait,
} from "@/lib/client/ClientUtils";

test(camelCaseToTitleCase.name, () => {
	expect(camelCaseToTitleCase("notLinkedToTba")).toBe("Not Linked To Tba");
});

test(toDict.name, () => {
	const array = [
		{ _id: "1", name: "one" },
		{ _id: "2", name: "two" },
		{ _id: "3", name: "three" },
	];

	const dict = {
		"1": { _id: "1", name: "one" },
		"2": { _id: "2", name: "two" },
		"3": { _id: "3", name: "three" },
	};

	expect(toDict(array)).toEqual(dict);
});

test(`${removeDuplicates.name}: 1D array`, () => {
	const arr = [1, 2, 3, 4, 1, 2, 3, 4, 5];
	expect(removeDuplicates(arr)).toEqual([1, 2, 3, 4, 5]);
});

test(`${removeDuplicates.name}: 2D array`, () => {
	const arr = [[1, 2], [3, 4], [1, 2], [3, 4], [5]];
	expect(removeDuplicates(arr)).toEqual([1, 2, 3, 4, 5]);
});

test(`${removeDuplicates.name}: Not in place`, () => {
	const arr = [1, 2, 3, 4, 5, 1, 2, 3, 4];
	const original = arr.slice();
	removeDuplicates(arr);
	expect(arr).toEqual(original);
});

test(rotateArray.name, () => {
	const arr = [1, 2, 3, 4, 5];
	rotateArray(arr);
	expect(arr).toEqual([2, 3, 4, 5, 1]);
});

test(removeWhitespaceAndMakeLowerCase.name, () => {
	expect(removeWhitespaceAndMakeLowerCase("Hello World")).toBe("helloworld");
	expect(removeWhitespaceAndMakeLowerCase("Hello World ")).toBe("helloworld");
	expect(removeWhitespaceAndMakeLowerCase(" Hello World")).toBe("helloworld");
	expect(removeWhitespaceAndMakeLowerCase(" Hello  World ")).toBe("helloworld");
});

test(`${promisify.name}: Resolves`, async () => {
	const func = (resolve: () => void) => {
		resolve();
	};

	const funcAsync = promisify(func);
	return expect(funcAsync()).resolves.toBeUndefined();
});

test(`${promisify.name}: Rejects`, async () => {
	const func = (resolve: () => void, reject: (err: string) => void) => {
		reject("error");
	};

	const funcAsync = promisify(func);
	return expect(funcAsync()).rejects.toBe("error");
});

describe(wait.name, () => {
	test("Waits for at least the specified time", async () => {
		const durations = [10, 50, 100, 500, 1000];

		for (const duration of durations) {
			const start = Date.now();
			await wait(duration);
			const end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(duration);
		}
	});

	test("Waits for at most the specified time", async () => {
		const durations = [10, 50, 100, 500, 1000];
		const iterations = 10;

		// The value of each trial is how much it overshot the duration
		const trials: Promise<number>[] = [];
		for (let i = 0; i < iterations; i++) {
			for (const duration of durations) {
				trials.push(
					(async () => {
						const start = Date.now();
						await wait(duration);
						const end = Date.now();
						return end - start - duration;
					})(),
				);
			}
		}

		const results = await Promise.all(trials);
		for (const result of results) {
			expect(result).toBeLessThanOrEqual(20);
		}
	});
});
