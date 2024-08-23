export enum Defense {
  None = "None",
  Partial = "Partial",
  Full = "Full",
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