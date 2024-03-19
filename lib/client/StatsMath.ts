import { Report } from "../Types";

const SpeakerAutoPoints = 5;
const SpeakerTeleopPoints = 2;
const AmpAutoPoints = 2;
const AmpTeleopPoints = 1;
const TrapPoints = 5;

export function Round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function TotalPoints(reports: Report[]) {
  const speakerAuto =
    NumericalTotal("AutoScoredSpeaker", reports) * SpeakerAutoPoints;
  const speakerTeleop =
    NumericalTotal("TeleopScoredAmp", reports) * SpeakerTeleopPoints;

  const ampAuto = NumericalTotal("AutoScoredAmp", reports) * AmpAutoPoints;
  const ampTeleop =
    NumericalTotal("TeleopScoredAmp", reports) * AmpTeleopPoints;

  const trap = NumericalTotal("TeleopScoredTrap", reports) * TrapPoints;

  return Round(speakerAuto + speakerTeleop + ampAuto + ampTeleop + trap);
}

export function AveragePoints(reports: Report[]) {
  const totalPoints = reports.map((report) => TotalPoints([report]));
  return Round(totalPoints.reduce((a, b) => a + b, 0) / reports.length);
}

export function StandardDeviation(numbers: number[]) {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((a, b) => a + (b - mean) ** 2, 0) / numbers.length;
  return Math.sqrt(variance);
}

export function NumericalTotal(field: string, reports: Report[]) {
  let sum = 0;
  reports?.forEach((report) => (sum += report.data[field]));
  return Round(sum);
}

export function MostCommonValue(field: string, reports: Report[]) {
  // Get a list of all values of the specified field
  let values: string[] = [];
  reports?.forEach((report) => values.push(report.data[field]));

  // Count the occurrences of each value
  const occurences: { [key: string]: number } = {};
  values.forEach((num) => (occurences[num] ? (occurences[num] += 1) : (occurences[num] = 1)));

  // Return the most common value
  const sortedValues = Object.keys(occurences).sort((a, b) => occurences[b] - occurences[a]);
  const mode = sortedValues[0];

  return mode === "undefined" ? "Unknown" : mode;
}

export function BooleanAverage(field: string, reports: Report[]) {
  const trues = reports?.filter((report) => report.data[field] === true).length;

  return trues / reports?.length > 0.5;
}

export function NumericalAverage(field: string, reports: Report[]) {
  return Round(NumericalTotal(field, reports) / reports?.length);
}

export function ComparativePercent(
  field1: string,
  field2: string,
  reports: Report[],
) {
  const a = NumericalTotal(field1, reports);
  const b = NumericalTotal(field2, reports);

  if (a === 0 && b === 0) {
    return "0%";
  }

  return Round(a / (b + a) * 100) + "%";
}
