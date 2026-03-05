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

export enum FrcDrivetrain {
	Tank = "Tank",
	Swerve = "Swerve",
	Mecanum = "Mecanum",
}

export enum FtcDrivetrain {
	Tank = FrcDrivetrain.Tank, // Reference the other enum to allow interoperability
	Mecanum = FrcDrivetrain.Mecanum,
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

export namespace ReefscapeEnums {
	export enum EndgameClimbStatus {
		None = "None",
		Park = "Park",
		High = "High",
		Low = "Low",
	}

	export enum DriveThroughDeepCage {
		No = "No",
		Slow = "Slow",
		Fast = "Fast",
	}

	export enum AutoCapabilities {
		NoAuto = "No Auto",
		MovePastStart = "Move Past Start",
		ScoreOneCoral = "Score One Coral",
		ScoreMoreThanOneCoral = "ScoreMoreThanOneCoral",
	}

	export enum Climbing {
		No = "No",
		Deep = "Deep",
		Shallow = "Shallow",
	}
}

export namespace RebuiltEnums {
	export enum ClimbingAbilities {
		No = "No",
		FirstLevel = "FirstLevel",
		SecondLevel = "SecondLevel",
		ThirdLevel = "ThirdLevel",
	}

	export enum DriveOverBump {
		No = "No",
		Slow = "Slow",
		Fast = "Fast",
	}

	export enum DriveUnderTrench {
		No = "No",
		Slow = "Slow",
		Fast = "Fast",
	}

	export enum LevelClimbed {
		No = "No",
		First = "First",
		Second = "Second",
		Third = "Third",
	}

	export enum AutoAbilities {
		NoAuto = "No Auto",
		MovePastStart = "Move Past Start",
		ClimbLevelOne = "Climb Level One",
		ScoreOneOrMoreFuel = "Score One Or More Fuel",
		ScoreFuelAndClimb = "Score Fuel And Climb",
	}
	export enum OffenceDriverSkill{
		LevelOne = "One",
		LevelTwo = "Two",
		LevelThree = "Three",
		LevelFour = "Four",
		LevelFive = "Five",
	}
	export enum DefenceDriverSkill {
		LevelOne = "One",
		LevelTwo = "Two",
		LevelThree = "Three",
		LevelFour = "Four",
		LevelFive = "Five",

export namespace DecodeEnums {
	export enum EndgameParkStatus {
		No = "No",
		Partial = "Partial",
		Full = "Full",
		TwoBotPark = "Two Bot Park",
	}

	export enum AutoCapabilities {
		NoAuto = "No Auto",
		MovePastStart = "Move Past Start",
		ScoreOneArtifact = "Score One Artifact",
		ScoreMultipleArtifacts = "Score Multiple Artifacts",
	}
}
