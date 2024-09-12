import { CenterStageEnums, Defense, Drivetrain, IntakeTypes } from './Enums';
import { Badge, FormLayoutProps, PitStatsLayout, StatsLayout } from "./Layout";
import { Report, Game, League, PitReportData, QuantData, Pitreport } from "./Types";
import { GameId } from "./client/GameId";
import { AmpAutoPoints, AmpTeleopPoints, BooleanAverage, MostCommonValue, NumericalTotal, Round, SpeakerAutoPoints, SpeakerTeleopPoints, TrapPoints } from "./client/StatsMath";

function getBaseBadges(pitReport: Pitreport<PitReportData> | undefined, quantitativeReports: Report<QuantData>[] | undefined) {
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

// Data keys use upper camel case so they can be used as labels in the forms

export namespace Crescendo {
  export class QuantitativeData extends QuantData {
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

  const pitReportLayout: FormLayoutProps<PitData> = {
    "Intake": ["intakeType"],
    "Shooter": ["canScoreAmp", "canScoreSpeaker", "fixedShooter", "canScoreFromDistance"],
    "Climber": ["canClimb"],
    "Auto": [{key: "autoNotes", type: "number"}]
  }

  const quantitativeReportLayout: FormLayoutProps<QuantitativeData> = {
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

  const pitStatsLayout: PitStatsLayout<PitData, QuantitativeData> = {
    overallSlideStats: [{
      label: "Avg Notes Scored",
      get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
        if (!quantitativeReports) return 0;

        return quantitativeReports.reduce(
          (acc, report) => acc 
            + report.data.AutoScoredSpeaker 
            + report.data.TeleopMissedSpeaker 
            + report.data.AutoScoredAmp 
            + report.data.TeleopScoredAmp
            + report.data.TeleopScoredTrap, 0)
          / quantitativeReports.length;
      }
    },
    {
      label: "Teleop Speaker Accuracy",
      get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
        if (!quantitativeReports) return 0;

        const scores = quantitativeReports.map(report => report.data.TeleopScoredSpeaker);
        const misses = quantitativeReports.map(report => report.data.TeleopMissedSpeaker);

        const scoreCount = scores.reduce((acc, score) => acc + score, 0);
        const missCount = misses.reduce((acc, miss) => acc + miss, 0);

        return scoreCount / (scoreCount + missCount);
      }
    },
    {
      label: "Teleop Amp Accuracy",
      get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
        if (!quantitativeReports) return 0;

        const scores = quantitativeReports.map(report => report.data.TeleopScoredAmp);
        const misses = quantitativeReports.map(report => report.data.TeleopMissedAmp);

        const scoreCount = scores.reduce((acc, score) => acc + score, 0);
        const missCount = misses.reduce((acc, miss) => acc + miss, 0);

        return scoreCount / (scoreCount + missCount);
      }
    },
    {
      label: "Avg Notes in Trap",
      key: "TeleopScoredTrap"
    }
  ],
    individualSlideStats: [
      {
        label: "Avg Teleop Points",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          const speakerAuto = NumericalTotal("AutoScoredSpeaker", quantitativeReports) * SpeakerAutoPoints;
          const speakerTeleop = NumericalTotal("TeleopScoredAmp", quantitativeReports) * SpeakerTeleopPoints;
          const ampAuto = NumericalTotal("AutoScoredAmp", quantitativeReports) * AmpAutoPoints;
          const ampTeleop = NumericalTotal("TeleopScoredAmp", quantitativeReports) * AmpTeleopPoints;
          const trap = NumericalTotal("TeleopScoredTrap", quantitativeReports) * TrapPoints;

          return Round(speakerAuto + speakerTeleop + ampAuto + ampTeleop + trap) / quantitativeReports.length;
        }
      },
      {
        label: "Avg Auto Points",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          const speakerAuto = NumericalTotal("AutoScoredSpeaker", quantitativeReports) * SpeakerAutoPoints;
          const ampAuto = NumericalTotal("AutoScoredAmp", quantitativeReports) * AmpAutoPoints;

          return Round(speakerAuto + ampAuto) / quantitativeReports.length;
        }
      },
      {
        label: "Avg Speaker Points",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          const speakerAuto = NumericalTotal("AutoScoredSpeaker", quantitativeReports) * SpeakerAutoPoints;
          const speakerTeleop = NumericalTotal("TeleopScoredAmp", quantitativeReports) * SpeakerTeleopPoints;

          return Round(speakerAuto + speakerTeleop) / quantitativeReports.length;
        }
      },
      {
        label: "Avg Amp Points",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          const ampAuto = NumericalTotal("AutoScoredAmp", quantitativeReports) * AmpAutoPoints;
          const ampTeleop = NumericalTotal("TeleopScoredAmp", quantitativeReports) * AmpTeleopPoints;

          return Round(ampAuto + ampTeleop) / quantitativeReports.length;
        }
      }
    ],
    robotCapabilities: [
      {
        label: "Intake Type",
        key: "intakeType"
      }
    ],
    graphStat: {
      label: "Avg Notes Scored",
      get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
        if (!quantitativeReports) return 0;

        return quantitativeReports.reduce(
          (acc, report) => acc 
            + report.data.AutoScoredSpeaker 
            + report.data.TeleopMissedSpeaker 
            + report.data.AutoScoredAmp 
            + report.data.TeleopScoredAmp
            + report.data.TeleopScoredTrap, 0)
          / quantitativeReports.length;
      }
    }
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

  function getBadges(pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined, card: boolean) {
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

  export const game = new Game("Crescendo", 2024, League.FRC, QuantitativeData, PitData, pitReportLayout, quantitativeReportLayout, 
    statsLayout, pitStatsLayout, 
    "Crescendo", "https://www.firstinspires.org/sites/default/files/uploads/resource_library/frc/crescendo/crescendo.png",
   getBadges, getAvgPoints);
}

export namespace CenterStage {
  export class QuantitativeData extends QuantData {
    AutoScoredBackstage: number = 0;
    AutoScoredBackdrop: number = 0;
    AutoPlacedPixelOnSpikeMark: boolean = false;
    AutoParked: boolean = false;

    TeleopScoredBackstage: number = 0;
    Mosaics: number = 0;
    SetLinesReached: number = 0;

    LandingZoneReached: number = 0;
    EndgameParked: boolean = false;
    EndgameClimbed: boolean = false;
  }

  export class PitData extends PitReportData {
    AutoBackstageSideExists: boolean = false;
    AutoBackstageParkingLocation: CenterStageEnums.CenterStageParkingLocation = CenterStageEnums.CenterStageParkingLocation.NotApplicable;
    AutoBackstageCanPlacePurplePixel: boolean = false;
    AutoBackstageCanPlaceYellowPixelOnBackboard: boolean = false;
    AutoBackstageCanPark: boolean = false;
    AutoBackstageWhitePixels: number = 0;
    AutoBackstageAdjustableToFitOurs: CenterStageEnums.AutoAdjustable = CenterStageEnums.AutoAdjustable.NoNeed;

    AutoAudienceSideExists: boolean = false;
    AutoAudienceParkingLocation: CenterStageEnums.CenterStageParkingLocation = CenterStageEnums.CenterStageParkingLocation.NotApplicable;
    AutoAudienceCanPlacePurplePixel: boolean = false;
    AutoAudienceCanPlaceYellowPixelOnBackboard: boolean = false;
    AutoAudienceCanPark: boolean = false;
    AutoAudienceWhitePixels: number = 0;
    AutoAudienceAdjustableToFitOurs: CenterStageEnums.AutoAdjustable = CenterStageEnums.AutoAdjustable.NoNeed;
    
    AutoSidePreference: CenterStageEnums.AutoSidePreference = CenterStageEnums.AutoSidePreference.NoPreference;

    CanPlaceOnBackboard: boolean = false;
    CanPickUpFromStack: boolean = false;
    PixelsMovedAtOnce: number = 0;

    EndgameCanLaunchDrone: boolean = false;
    EndgameCanHang: boolean = false;
    EndgameCanPark: boolean = false;
  }

  const quantitativeReportLayout: FormLayoutProps<QuantitativeData> = {
    "Auto": [
      [["AutoScoredBackstage"], ["AutoScoredBackdrop"]],
      "AutoPlacedPixelOnSpikeMark",
      "AutoParked"
    ],
    "Teleop": [
      [
        ["TeleopScoredBackstage"], 
        ["Mosaics"], 
        ["SetLinesReached"]
      ]
    ],
    "Endgame": [
      [["LandingZoneReached"]],
      "EndgameParked",
      "EndgameClimbed"
    ]
  }

  const pitReportLayout: FormLayoutProps<PitData> = {
    "Backstage Auto": [
      { key: "AutoBackstageSideExists", label: "Has Auto?" },
      { key: "AutoBackstageParkingLocation", label: "Parking Location" },
      { key: "AutoBackstageCanPlacePurplePixel", label: "Can Place Purple Pixel?" },
      { key: "AutoBackstageCanPlaceYellowPixelOnBackboard", label: "Can Place Yellow Pixel on Backboard?" },
      { key: "AutoBackstageCanPark", label: "Can Park?" },
      { key: "AutoBackstageWhitePixels", label: "White Pixels Place" },
      { key: "AutoBackstageAdjustableToFitOurs", label: "Adjustable to Fit Our Auto?" }
    ],
    "Audience Auto": [
      { key: "AutoAudienceSideExists", label: "Has Auto?" },
      { key: "AutoAudienceParkingLocation", label: "Parking Location" },
      { key: "AutoAudienceCanPlacePurplePixel", label: "Can Place Purple Pixel?" },
      { key: "AutoAudienceCanPlaceYellowPixelOnBackboard", label: "Can Place Yellow Pixel on Backboard?" },
      { key: "AutoAudienceCanPark", label: "Can Park?" },
      { key: "AutoAudienceWhitePixels", label: "White Pixels Place" },
      { key: "AutoAudienceAdjustableToFitOurs", label: "Adjustable to Fit Our Auto?" }
    ],
    "Auto": ["AutoSidePreference"],
    "Teleop": [
      "CanPlaceOnBackboard",
      "CanPickUpFromStack",
      "PixelsMovedAtOnce"
    ],
    "Endgame": [
      { key: "EndgameCanLaunchDrone", label: "Can Launch Drone?" },
      { key: "EndgameCanHang", label: "Can Hang?" },
      { key: "EndgameCanPark", label: "Can Park?" }
    ]
  }

  const statsLayout: StatsLayout<PitData, QuantitativeData> = {
    "Auto": [
      {
        stats: [
          { label: "Avg Scored Backstage", key: "AutoScoredBackstage" },
          { label: "Avg Scored Backdrop", key: "AutoScoredBackdrop" }
        ],
        label: "Overall Auto Accuracy"
      }
    ],
    "Teleop": [
      {
        label: "Avg Scored Backstage", key: "TeleopScoredBackstage"
      },
      {
        label: "Avg Mosaics", key: "Mosaics"
      },
      {
        label: "Avg Set Lines Reached", key: "SetLinesReached"
      }
    ],
    "Endgame": [
      {
        label: "Avg Landing Zone Reached", key: "LandingZoneReached"
      }
    ]
  }

  const pitStatsLayout: PitStatsLayout<PitData, QuantitativeData> = {
    overallSlideStats: [
      {
        label: "Avg Props",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          return quantitativeReports.reduce(
            (acc, report) => acc + report.data.HasTeamProp + report.data.HasDrone, 0)
            / quantitativeReports.length;
        }
      }
    ],
    individualSlideStats: [
      {
        label: "Avg Auto Points",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          const autoBackstage = NumericalTotal("AutoScoredBackstage", quantitativeReports);
          const autoBackdrop = NumericalTotal("AutoScoredBackdrop", quantitativeReports);

          return Round(autoBackstage + autoBackdrop) / quantitativeReports.length;
        }
      },
      {
        label: "Avg Teleop Points",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          const teleopBackstage = NumericalTotal("TeleopScoredBackstage", quantitativeReports);
          const mosaics = NumericalTotal("Mosaics", quantitativeReports);
          const setLines = NumericalTotal("SetLinesReached", quantitativeReports);

          return Round(teleopBackstage + mosaics + setLines) / quantitativeReports.length;
        }
      },
      {
        label: "Avg Endgame Points",
        get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
          if (!quantitativeReports) return 0;

          const landingZone = NumericalTotal("LandingZoneReached", quantitativeReports);

          return Round(landingZone) / quantitativeReports.length;
        }
      }
    ],
    robotCapabilities: [
      {
        label: "Has Team Prop",
        key: "HasTeamProp"
      },
      {
        label: "Has Drone",
        key: "HasDrone"
      }
    ],
    graphStat: {
      label: "Avg Props",
      get: (pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined) => {
        if (!quantitativeReports) return 0;

        return quantitativeReports.reduce(
          (acc, report) => acc + report.data.HasTeamProp + report.data.HasDrone, 0)
          / quantitativeReports.length;
      }
    }
  }

  function getBadges(pitReport: Pitreport<PitData> | undefined, quantitativeReports: Report<QuantitativeData>[] | undefined, card: boolean) {
    const badges: Badge[] = getBaseBadges(pitReport, quantitativeReports);

    if (pitReport?.data?.HasDrone)
      badges.push({ text: "Has Drone", color: "primary" });
    if (pitReport?.data?.HasTeamProp)
      badges.push({ text: "Has Team Prop", color: "info" });
    if (pitReport?.data?.AutoBackstageSideExists)
      badges.push({ text: "Has Auto Backstage", color: "success" });
    if (pitReport?.data?.AutoAudienceSideExists)
      badges.push({ text: "Has Auto Audience", color: "success" });
    if (pitReport?.data?.AutoBackstageCanPlacePurplePixel)
      badges.push({ text: card ? "Purple Pixel Backstage Auto" : "Can Place Purple Pixel In Backstage Auto", color: "accent" });
    if (pitReport?.data?.AutoBackstageCanPlaceYellowPixelOnBackboard)
      badges.push({ text: card ? "Yellow Pixel Backstage Auto" : "Can Place Yellow Pixel On Backboard In Backstage Auto", color: "accent" });
    if (pitReport?.data?.AutoAudienceCanPlacePurplePixel)
      badges.push({ text: card ? "Purple Pixel Audience Auto" : "Can Place Purple Pixel In Audience Auto", color: "secondary" });
    if (pitReport?.data?.AutoAudienceCanPlaceYellowPixelOnBackboard)
      badges.push({ text: card ? "Yellow Pixel Audience Auto" : "Can Place Yellow Pixel On Backboard In Audience Auto", color: "secondary" });
    if (pitReport?.data?.AutoBackstageCanPark)
      badges.push({ text: "Can Park In Backstage Auto", color: "accent" });
    if (pitReport?.data?.AutoAudienceCanPark)
      badges.push({ text: "Can Park In Audience Auto", color: "secondary" });
    if (pitReport?.data?.CanPlaceOnBackboard)
      badges.push({ text: "Can Place On Backboard", color: "primary" });
    if (pitReport?.data?.CanPickUpFromStack)
      badges.push({ text: "Can Pick Up From Stack", color: "info" });
    if (pitReport?.data?.EndgameCanLaunchDrone)
      badges.push({ text: "Can Launch Drone", color: "success" });
    if (pitReport?.data?.EndgameCanHang)
      badges.push({ text: "Can Hang", color: "accent" });
    if (pitReport?.data?.EndgameCanPark)
      badges.push({ text: "Can Park", color: "primary" });

    return badges;
  }

  /** NOT ACCURATE, just for demo */
  function getAvgPoints(reports: Report<QuantitativeData>[] | undefined) {
    console.log("Getting avg points");

    if (!reports) return 0;

    const autoBackstage = NumericalTotal("AutoScoredBackstage", reports);
    const autoBackdrop = NumericalTotal("AutoScoredBackdrop", reports);
    const teleopBackstage = NumericalTotal("TeleopScoredBackstage", reports);
    const mosaics = NumericalTotal("Mosaics", reports);
    const setLines = NumericalTotal("SetLinesReached", reports);
    const landingZone = NumericalTotal("LandingZoneReached", reports);

    return Round(autoBackstage + autoBackdrop + teleopBackstage + mosaics + setLines + landingZone) / Math.max(reports.length, 1);
  }

  export const game = new Game("Center Stage", 2024, League.FTC, QuantitativeData, PitData, pitReportLayout, quantitativeReportLayout, statsLayout,
    pitStatsLayout, "CenterStage", "https://www.firstinspires.org/sites/default/files/uploads/resource_library/ftc/centerstage/centerstage.png",
    getBadges, getAvgPoints);
}

namespace IntoTheDeep {
  export class QuantitativeData extends QuantData {
    StartedWith: "None" | "Sample" | "Specimen" = "None";

    AutoScoredNetZone: number = 0;
    AutoScoredLowNet: number = 0;
    AutoScoredHighNet: number = 0;
    AutoScoredLowRung: number = 0;
    AutoScoredHighRung: number = 0;

    TeleopScoredNetZone: number = 0;
    TeleopScoredLowNet: number = 0;
    TeleopScoredHighNet: number = 0;
    TeleopScoredLowRung: number = 0;
    TeleopScoredHighRung: number = 0;

    EndgameLevelClimbed: "None" | "Parked" | "Touched the Rung" | "Low Level Climb" | "High Level Climb" = "None";
  }

  export const game = new Game("Into the Deep", 2025, League.FTC, QuantitativeData, PitData, pitReportLayout, quantitativeReportLayout, statsLayout,
    pitStatsLayout, "IntoTheDeep", "https://info.firstinspires.org/hubfs/Dive/into-the-deep.svg",
  );
}

export const games: { [id in GameId]: Game<any, any> } = Object.freeze({
  [GameId.IntoTheDeep]: IntoTheDeep.game,
  [GameId.Crescendo]: Crescendo.game,
  [GameId.CenterStage]: CenterStage.game
});