import { StringKeyedObject, ElementType } from "./Layout";

export enum Defense {
  None = "None",
  Partial = "Partial",
  Full = "Full",
}

export enum FTCEndgame {
  None = "None",
  Parked = "Parked",
  TouchingTheLowerBar = "Touching the Lower Bar",
  LowClimb = "Low Climb",
  HighClimb = "High Climb",
}

export enum IntakeTypes {
  None = "None",
  Human = "Human",
  Ground = "Ground",
  Both = "Both",
}

export enum Drivetrain {
  Tank = "Tank",
  Swerve = "Swerve",
  Mecanum = "Mecanum",
}

export enum Motors {
  CIMs = "CIM",
  Krakens = "Krakens",
  Falcons = "Falcons",
  Talons = "Talons",
  Neos = "Neos",
}

export enum SwerveLevel {
  None = "None",
  L1 = "L1",
  L2 = "L2",
  L3 = "L3",
}

export namespace CenterStageEnums {
  export enum CenterStageParkingLocation {
    Corner = "Corner",
    Center = "Center",
    FarSide = "Far Side",
    NotApplicable = "N/A",
  }

  export enum AutoAdjustable {
    NoNeed = "No Need",
    Yes = "Yes",
    No = "No",
  }

  export enum AutoSidePreference {
    Backstage = "Backstage",
    Audience = "Audience",
    NoPreference = "No Preference",
  }
}

export namespace IntoTheDeepEnums {
  export enum StartedWith {
    Nothing = "Nothing",
    Sample = "Sample",
    Specimen = "Specimen",
  }

  export enum EndgameLevelClimbed {
    None = "None",
    Parked = "Parked",
    TouchedLowRung = "Touched Low Rung",
    LowLevelClimb = "Low Level Climb",
    HighLevelClimb = "High Level Climb",
  }
}

export function keyToEnum(key: string, exampleData: StringKeyedObject): ElementType {
  if (key === "image")
    return "image";

  const type = typeof exampleData[key];
  if (type !== "string")
    return type as ElementType;

  const enums = [
    IntakeTypes, Defense, Drivetrain, Motors, SwerveLevel, 
    CenterStageEnums.CenterStageParkingLocation, CenterStageEnums.AutoAdjustable, CenterStageEnums.AutoSidePreference,
    IntoTheDeepEnums.StartedWith, IntoTheDeepEnums.EndgameLevelClimbed
  ];

  if (key === "Defense")
    return Defense;
  if (key === "swerveLevel")
    return SwerveLevel;

  if (key === "StartedWith")
    return IntoTheDeepEnums.StartedWith;
  if (key === "EndgameLevelClimbed")
    return IntoTheDeepEnums.EndgameLevelClimbed;

  for (const e of enums) {
    if (Object.values(e).includes(exampleData[key]))
      return e;
  }

  return "string";
}