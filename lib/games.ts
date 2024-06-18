import { Game, IntakeTypes, League, PitReportData, QuantitativeFormData } from "./Types";
import { GameId } from "./client/GameId";

export class CrescendoQuantitativeFormData extends QuantitativeFormData {
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

export class CrescendoPitReportData extends PitReportData {
  intakeType: IntakeTypes = IntakeTypes.None;
  canClimb: boolean = false;  
  fixedShooter: boolean = false;
  canScoreAmp: boolean = false;
  canScoreSpeaker: boolean = false;
  canScoreFromDistance: boolean = false;
  underBumperIntake: boolean = false;
  autoNotes: number = 0;
}

export const games: { [id in GameId]: Game<any, any> } = Object.freeze({
  [GameId.Crescendo]: new Game("Crescendo", 2024, League.FRC, CrescendoQuantitativeFormData, CrescendoPitReportData)
});