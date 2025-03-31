import { QuantData, Report } from "../Types";
import {Reefscape} from "../games"

export const SpeakerAutoPoints = 5;
export const SpeakerTeleopPoints = 2;
export const AmpAutoPoints = 2;
export const AmpTeleopPoints = 1;
export const TrapPoints = 5;

type Selector<T extends QuantData> = ((r: T) => number) | (keyof T & string);

function getSelection<T extends QuantData>(
	selector: Selector<T>,
	report: Record<string, any>,
) {
	return typeof selector === "string"
		? report.data[selector]
		: selector(report.data);
}

/**
 * Rounds to two decimal places
 *
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function Round(n: number): number {
	return Math.round(n * 100) / 100;
}

/**
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function StandardDeviation(numbers: number[]) {
	const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
	const variance =
		numbers.reduce((a, b) => a + (b - mean) ** 2, 0) / numbers.length;
	return Math.sqrt(variance);
}

/**
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function NumericalTotal<T extends QuantData>(
	selector: Selector<T>,
	reports: Report<T>[],
) {
	let sum = 0;
	reports?.forEach((report) => (sum += getSelection(selector, report)));
	return Round(sum);
}

/**
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function MostCommonValue<T extends QuantData>(
	selector: Selector<T>,
	objects: Record<string, any>[],
) {
	// Get a list of all values of the specified field
	let values: string[] = [];
	objects?.forEach((report) => {
		const val = getSelection(selector, report);
		values.push((val as any)?.toString?.() ?? JSON.stringify(val));
	});

	// Count the occurrences of each value
	const occurences: { [key: string]: number } = {};
	values.forEach((num) =>
		occurences[num] ? (occurences[num] += 1) : (occurences[num] = 1),
	);

	// Return the most common value
	const sortedValues = Object.keys(occurences).sort(
		(a, b) => occurences[b] - occurences[a],
	);
	const mode = sortedValues[0];

	return mode === "undefined" ? "Unknown" : mode;
}

/**
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function BooleanAverage<T extends QuantData>(
	selector: Selector<T>,
	reports: Report<T>[],
) {
	const trues = reports?.filter(
		(report) => getSelection(selector, report) === true,
	).length;

	return trues / Math.max(reports?.length, 1) > 0.5;
}

/**
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function NumericalAverage<T extends QuantData>(
	selector: Selector<T>,
	reports: Report<T>[],
) {
	return Round(NumericalTotal(selector, reports) / reports?.length);
}

/**
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function ComparativePercent<T extends QuantData>(
	selector1: Selector<T>,
	selector2: Selector<T>,
	reports: Report<T>[],
) {
	const a = NumericalTotal(selector1, reports);
	const b = NumericalTotal(selector2, reports);

	if (a === 0 && b === 0) {
		return "0%";
	}

	return Round((a / (b + a)) * 100) + "%";
}

/**
 * @tested_by tests/lib/client/StatsMath.test.ts
 */
export function ComparativePercentMulti<T extends QuantData>(
	selectors: Selector<T>[],
	reports: Report<T>[],
) {
	const results: string[] = [];
	const totals = selectors.map((selectors) =>
		NumericalTotal(selectors, reports),
	);

	let sum = 0;
	for (let i = 0; i < totals.length; i++) {
		sum += totals[i];
	}

	for (let i = 0; i < totals.length; i++) {
		results.push(Round((totals[i] / sum) * 100) + "%");
	}

	if (sum === 0) {
		return 0;
	}

	return results;
}

export function GetMinimum(
	quantitativeReports: Report<Reefscape.QuantitativeData>[],
	stat: string,
) {
	if (!quantitativeReports) return 0;
	let minimum = 0;
	for (let repo of quantitativeReports) {
		if (repo.data.AutoCoralScoredLevelOne > minimum) {
			minimum = repo.data["AutoCoralScoredLevelOne"];
		}
	}
	return minimum;
}
