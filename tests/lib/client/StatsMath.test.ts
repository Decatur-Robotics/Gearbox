import {
	BooleanAverage,
	ComparativePercent,
	MostCommonValue,
	NumericalAverage,
	NumericalTotal,
	Round,
	StandardDeviation,
} from "@/lib/client/StatsMath";
import { QuantData, Report } from "@/lib/Types";

test(Round.name, () => {
	expect(Round(1.23456789)).toBe(1.23);
	expect(Round(1.23556789)).toBe(1.24);
	expect(Round(1.2)).toBe(1.2);
	expect(Round(1.0)).toBe(1.0);
	expect(Round(1)).toBe(1);
});

test(StandardDeviation.name, () => {
	expect(StandardDeviation([1, 2, 3, 4, 5])).toBeCloseTo(1.41, 2);
	expect(StandardDeviation([1, 2, 3, 4, 5, 6])).toBeCloseTo(1.71, 2);
	expect(StandardDeviation([1, 2, 3, 4, 5, 6, 7])).toBeCloseTo(2.0, 2);
	expect(StandardDeviation([1, 1, 1])).toBeCloseTo(0, 2);
});

test(`${NumericalTotal.name}: String selector`, () => {
	const reports = [
		{ data: { a: 1, b: 2 } },
		{ data: { a: 4, b: 5 } },
		{ data: { a: 7, b: 8 } },
	];

	expect(NumericalTotal("a", reports as any)).toBe(12);
	expect(NumericalTotal("b", reports as any)).toBe(15);
});

test(`${NumericalTotal.name}: Function selector`, () => {
	const reports = [
		{ data: { a: 1, b: 2 } },
		{ data: { a: 4, b: 5 } },
		{ data: { a: 7, b: 8 } },
	];

	expect(NumericalTotal((r) => (r as any).a, reports as any)).toBe(12);
	expect(NumericalTotal((r) => (r as any).b, reports as any)).toBe(15);
});

test(MostCommonValue.name, () => {
	const reports = [
		{ data: { a: 1, b: 2 } },
		{ data: { a: 1, b: 2 } },
		{ data: { a: 2, b: 1 } },
	];

	expect(MostCommonValue("a", reports as any)).toBe("1");
	expect(MostCommonValue((r) => (r as any).b, reports as any)).toBe("2");
});

test(BooleanAverage.name, () => {
	const reports = [
		{ data: { a: true, b: false } },
		{ data: { a: false, b: false } },
		{ data: { a: true, b: true } },
	];

	expect(BooleanAverage("a", reports as any)).toBe(true);
	expect(BooleanAverage((r) => (r as any).b, reports as any)).toBe(false);
});

test(NumericalAverage.name, () => {
	const reports = [
		{ data: { a: 1, b: 2 } },
		{ data: { a: 4, b: 5 } },
		{ data: { a: 7, b: 8 } },
	];

	expect(NumericalAverage("a", reports as any)).toBe(4);
	expect(NumericalAverage((r) => (r as any).b, reports as any)).toBe(5);
});

test(ComparativePercent.name, () => {
	const reports = [{ data: { a: 1, b: 3 } }, { data: { a: 1, b: 3 } }];

	expect(ComparativePercent("a", "b", reports as any)).toBe("25%");
	expect(
		ComparativePercent(
			(r) => (r as any).a,
			(r) => (r as any).b,
			reports as any,
		),
	).toBe("25%");
});
