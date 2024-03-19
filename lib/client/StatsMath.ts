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
  const speakerAuto =
    NumericalAverage("AutoScoredSpeaker", reports) * SpeakerAutoPoints;
  const speakerTeleop =
    NumericalAverage("TeleopScoredAmp", reports) * SpeakerTeleopPoints;

  const ampAuto = NumericalAverage("AutoScoredAmp", reports) * AmpAutoPoints;
  const ampTeleop =
    NumericalAverage("TeleopScoredAmp", reports) * AmpTeleopPoints;

  const trap = NumericalAverage("TeleopScoredTrap", reports) * TrapPoints;

  return Round(speakerAuto + speakerTeleop + ampAuto + ampTeleop + trap);
}

export function NumericalTotal(field: string, reports: Report[]) {
  let sum = 0;
  reports?.forEach((report) => (sum += report.data[field]));
  return Round(sum);
}

export function StringAverage(field: string, reports: Report[]) {
  let strings: string[] = [];
  reports?.forEach((report) => strings.push(report.data[field]));
  const store: { [key: string]: number } = {};
  strings.forEach((num) => (store[num] ? (store[num] += 1) : (store[num] = 1)));
  return Object.keys(store).sort((a, b) => store[b] - store[a])[0];
}

export function BooleanAverage(field: string, reports: Report[]) {
  const arr: boolean[] = [];
  reports?.forEach((report) => arr.push(report.data[field]));
  const count = arr.filter((value) => value).length;
  return count > arr.length - count;
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
  return Round(a / (b + a));
}
