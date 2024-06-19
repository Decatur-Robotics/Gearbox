import { Report, Badge, Game, IntakeTypes, League, PitReportData, PitReportLayout, QuantitativeFormData, QuantitativeReportLayout, Defense, Drivetrain, Pitreport, StatsLayout } from "./Types";
import { GameId } from "./client/GameId";
import { AmpAutoPoints, AmpTeleopPoints, BooleanAverage, MostCommonValue, NumericalTotal, Round, SpeakerAutoPoints, SpeakerTeleopPoints, TrapPoints } from "./client/StatsMath";

function getBaseBadges(pitReport: Pitreport<PitReportData> | undefined, quantitativeReports: Report<QuantitativeFormData>[] | undefined) {
  const badges: Badge[] = [];
  const pitData = pitReport?.data;

  const defense = MostCommonValue("Defense", quantitativeReports ?? []);
  const drivetrain = pitData?.drivetrain;
  const motorType = pitData?.motorType;
  const swerveLevel = pitData?.swerveLevel;

  if (defense && defense !== Defense.None) {
    badges.push({ text: defense + " Defense", color: defense === Defense.Full ? "primary" : "info" });
  }

  if (pitReport?.submitted && drivetrain) {
    const drivetrainBadge: Badge = { text: drivetrain, color: "info" };

    if (motorType) {
      drivetrainBadge.text += " (" + motorType;
    }

    if (drivetrain === Drivetrain.Swerve) {
      drivetrainBadge.color = "primary";
      drivetrainBadge.text += ", " + swerveLevel;
    }
    else if (drivetrain === Drivetrain.Mecanum) {
      drivetrainBadge.color = "warning";
    }

    if (drivetrainBadge.text.includes("(")) {
      drivetrainBadge.text += ")";
    }

    badges.push(drivetrainBadge);
  }

  return badges;
}

export namespace Crescendo {
  export class QuantitativeData extends QuantitativeFormData {
    AutoScoredAmp: number = 0; // # of times scored in the amp
    AutoMissedAmp: number = 0;
    AutoScoredSpeaker: number = 0;
    AutoMissedSpeaker: number = 0;
    MovedOut: boolean = false;
  
    TeleopScoredAmp: number = 0;
    TeleopMissedAmp: number = 0;
    TeleopScoredSpeaker: number = 0;
    TeleopMissedSpeaker: number = 0;
    TeleopScoredTrap: number = 0;
    TeleopMissedTrap: number = 0;
  
    Coopertition: boolean = false; // true if used any point in match
    ClimbedStage: boolean = false;
    ParkedStage: boolean = false;
    UnderStage: boolean = false;
  
    intakeType: IntakeTypes = IntakeTypes.Human;
  }

  export class PitData extends PitReportData {
    intakeType: IntakeTypes = IntakeTypes.None;
    canClimb: boolean = false;  
    fixedShooter: boolean = false;
    canScoreAmp: boolean = false;
    canScoreSpeaker: boolean = false;
    canScoreFromDistance: boolean = false;
    underBumperIntake: boolean = false;
    autoNotes: number = 0;
  }

  const pitReportLayout: PitReportLayout<PitData> = {
    "Intake": ["intakeType"],
    "Shooter": ["canScoreAmp", "canScoreSpeaker", "fixedShooter", "canScoreFromDistance"],
    "Climber": ["canClimb"],
    "Auto": [{key: "autoNotes", type: "number"}]
  }

  const quantitativeReportLayout: QuantitativeReportLayout<QuantitativeData> = {
    "Auto": [
      "MovedOut", 
      [
        ["AutoScoredAmp", "AutoMissedAmp"], 
        ["AutoScoredSpeaker", "AutoMissedSpeaker"]
      ]
    ],
    "Teleop": [
      [
        ["TeleopScoredAmp", "TeleopMissedAmp"],
        ["TeleopScoredSpeaker", "TeleopMissedSpeaker"],
        ["TeleopScoredTrap", "TeleopMissedTrap"]
      ],
      "Defense"
    ],
    "Summary": [
      { key: "Coopertition", label: "Coopertition Activated" }, "ClimbedStage", "ParkedStage", 
      { key: "UnderStage", label: "Went Under Stage" }
    ]
  }

  const statsLayout: StatsLayout<PitData, QuantitativeData> = {
    "Auto": [
      { 
        stats: [
          { label: "Avg Scored Amp Shots", key: "AutoScoredAmp" }, 
          { label: "Avg Missed Amp Shots", key: "AutoMissedAmp" }
        ], 
        label: "Overall Amp Accuracy" },
      { 
        stats: [
          { label: "Avg Scored Speaker Shots", key: "AutoScoredSpeaker" }, 
          { label: "Avg Missed Speaker Shots" , key: "AutoMissedSpeaker" }
        ],
        label: "Overall Speaker Accuracy" }
    ],
    "Teleop": [
      {
        stats: [
          { label: "Avg Scored Amp Shots", key: "TeleopScoredAmp" },
          { label: "Avg Missed Amp Shots", key: "TeleopMissedAmp" }
        ],
        label: "Overall Amp Accuracy"
      },
      {
        stats: [
          { label: "Avg Scored Speaker Shots", key: "TeleopScoredSpeaker" },
          { label: "Avg Missed Speaker Shots", key: "TeleopMissedSpeaker" }
        ],
        label: "Overall Speaker Accuracy"
      },
      {
        stats: [
          { label: "Avg Scored Trap Shots", key: "TeleopScoredTrap" },
          { label: "Avg Missed Trap Shots", key: "TeleopMissedTrap" }
        ],
        label: "Overall Trap Accuracy"
      }
    ]
  }

  function getAvgPoints(reports: Report<QuantitativeData>[] | undefined) {
    if (!reports) return 0;

    const speakerAuto = NumericalTotal("AutoScoredSpeaker", reports) * SpeakerAutoPoints;
    const speakerTeleop = NumericalTotal("TeleopScoredAmp", reports) * SpeakerTeleopPoints;
    const ampAuto = NumericalTotal("AutoScoredAmp", reports) * AmpAutoPoints;
    const ampTeleop = NumericalTotal("TeleopScoredAmp", reports) * AmpTeleopPoints;
    const trap = NumericalTotal("TeleopScoredTrap", reports) * TrapPoints;

    return Round(speakerAuto + speakerTeleop + ampAuto + ampTeleop + trap) / reports.length;
  }

  function getBadges(pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) {
    const pitData = pitReport?.data;
    const badges = getBaseBadges(pitReport, quantitativeReports);

    const intake = pitData?.intakeType;
    const cooperates = BooleanAverage("Coopertition", quantitativeReports ?? []);
    const climbs = BooleanAverage("ClimbedStage", quantitativeReports ?? []);
    const parks = BooleanAverage("ParkedStage", quantitativeReports ?? []);
    const understage = BooleanAverage("UnderStage", quantitativeReports ?? []);

    if (pitReport?.submitted && intake) {
      const intakeBadge: Badge = { text: intake, color: "primary" };
      if (intake === IntakeTypes.Human) {
        intakeBadge.color = "warning";
      }
      else if (intake === IntakeTypes.Both) {
        intakeBadge.color = "secondary";
      }
      else if (intake === IntakeTypes.None) {
        intakeBadge.color = "warning";
        intakeBadge.text = "No Intake";
      }

      badges.push(intakeBadge);
    }

    if (cooperates)
      badges.push({ text: "Cooperates", color: "success" });

    if (climbs)
      badges.push({ text: "Climbs", color: "accent" });

    if (parks)
      badges.push({ text: "Parks", color: "primary" });

    if (understage)
      badges.push({ text: "Can Go Under Stage", color: "success" });

    return badges;
  }

  export const game = new Game("Crescendo", 2024, League.FRC, QuantitativeData, PitData, pitReportLayout, quantitativeReportLayout, statsLayout, 
    "Crescendo", getBadges, getAvgPoints);
}

export namespace TestGame {
  const pitReportLayout: PitReportLayout<Crescendo.PitData> = {
    "Shooter": ["canScoreAmp", "canScoreSpeaker", "fixedShooter", "canScoreFromDistance"],
    "Climber": ["canClimb"],
  }

  const quantitativeReportLayout: QuantitativeReportLayout<Crescendo.QuantitativeData> = {
  }

  const statsLayout: StatsLayout<Crescendo.PitData, Crescendo.QuantitativeData> = {
  }

  export const game = new Game("Test", 2024, League.FRC, Crescendo.QuantitativeData, Crescendo.PitData, 
    pitReportLayout, quantitativeReportLayout, statsLayout, "Crescendo", getBaseBadges, () => 0);
}

export const latestGameId = GameId.Crescendo;

export const games: { [id in GameId]: Game<any, any> } = Object.freeze({
  [GameId.Crescendo]: Crescendo.game,
  [GameId.TestGame]: TestGame.game
});