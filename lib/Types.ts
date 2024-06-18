// A collection of all the standard types Gearbox uses
import {
  Account as NextAuthAccount,
  Session as NextAuthSession,
  User as NextAuthUser,
} from "next-auth";
import { TheBlueAlliance } from "./TheBlueAlliance";
import { GameId } from "./client/GameId";

/**
 * Standard Account Type
 * @remarks
 * Derived orginally from NextAuth's Account struct
 */
export interface Account extends NextAuthAccount {
  /**
   * ID for the Mongo database
   */
  _id: string;
}

export interface Session extends NextAuthSession {
  _id: string;
}

export class User implements NextAuthUser {
  id: string = "";
  _id: string | undefined;
  name: string | undefined;
  email: string | undefined;
  image: string;
  admin: boolean;
  slug: string | undefined;
  teams: string[];
  owner: string[];
  slackId: string = "";
  xp: number = 10;
  level: number = 1;
  onboardingComplete: boolean = false;

  constructor(
    name: string | undefined,
    email: string | undefined,
    image: string = process.env.DEFAULT_IMAGE,
    admin: boolean = false,
    slug: string | undefined,
    teams: string[] = [],
    owner: string[] = [],
    slackId: string = "",
    xp: number = 10,
    level: number = 1
  ) {
    this.name = name;
    this.email = email;
    this.image = image;
    this.admin = admin;
    this.slug = slug;
    this.teams = teams;
    this.owner = owner;
    this.slackId = slackId;
    this.xp = xp;
  }
}

export class Team {
  _id: string | undefined;
  name: string;
  slug: string | undefined;
  tbaId: string | undefined;
  number: number;

  owners: string[];
  users: string[];
  scouters: string[];
  subjectiveScouters: string[];
  requests: string[];

  seasons: string[];

  constructor(
    name: string,
    slug: string | undefined,
    tbaId: string | undefined,
    number: number,
    owners: string[] = [],
    users: string[] = [],
    scouters: string[] = [],
    subjectiveScouters: string[] = [],
    requests: string[] = [],
    seasons: string[] = []
  ) {
    this.name = name;
    this.slug = slug;
    this.tbaId = tbaId;
    this.number = number;
    this.owners = owners;
    this.users = users;
    this.scouters = scouters;
    this.subjectiveScouters = subjectiveScouters;
    this.seasons = seasons;
    this.requests = requests;
  }
}

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

export abstract class QuantitativeFormData {
  [key: string]: any;

  Presented: boolean = true;

  AutoStartX: number = 0; // pixel position of robot
  AutoStartY: number = 0;
  AutoStartAngle: number = 0; // stored... but probably wont ever be used

  Defense: Defense = Defense.None;

  drivetrain: Drivetrain = Drivetrain.Tank;

  comments: string = "";
}

export enum League {
  FTC, FRC
}

export class Game<TQuantitativeFormData extends QuantitativeFormData, TPitReportData extends PitReportData> {
  name: string;

  year: number;
  league: League;

  allianceSize: number

  quantitativeFormDataType: new() => TQuantitativeFormData;
  pitReportDataType: new() => TPitReportData;

  pitReportLayout: PitReportLayout<TPitReportData>;
  quantitativeReportLayout: QuantitativeReportLayout<TQuantitativeFormData>;

  fieldImagePrefix: string;

  /**
   * @param name 
   * @param year 
   * @param league 
   * @param quantitativeFormDataType 
   * @param pitReportDataType 
   * @param pitReportLayout will auto-populate fields from PitReportData (everything not unique to the game)
   */
  constructor(name: string, year: number, league: League, 
      quantitativeFormDataType: new() => TQuantitativeFormData, pitReportDataType: new() => TPitReportData, 
      pitReportLayout: PitReportLayout<TPitReportData>, quantitativeReportLayout: QuantitativeReportLayout<TQuantitativeFormData>,
      fieldImagePrefix: string) {
    this.name = name;
    this.year = year;
    this.league = league;
    this.allianceSize = league === League.FRC ? 3 : 2;

    this.quantitativeFormDataType = quantitativeFormDataType;
    this.pitReportDataType = pitReportDataType;

    this.pitReportLayout = Game.mergePitLayoutWithBaseLayout(pitReportLayout);
    this.quantitativeReportLayout = Game.mergeQuantitativeLayoutWithBaseLayout(quantitativeReportLayout);

    this.fieldImagePrefix = fieldImagePrefix;
  }

  private static mergePitLayoutWithBaseLayout<TData extends PitReportData>(layout: PitReportLayout<TData>) {
    const finalLayout: typeof layout = {
      "Image": [{ key: "image", type: "image" }],
      "Drivetrain": ["drivetrain", "motorType", "swerveLevel"]
    }

    for (const [header, keys] of Object.entries(layout)) {
      finalLayout[header] = keys;
    }

    finalLayout["Comments"] = ["comments"];

    return finalLayout;
  }
  
  private static mergeQuantitativeLayoutWithBaseLayout<TData extends QuantitativeFormData>(layout: QuantitativeReportLayout<TData>) {
    const finalLayout: typeof layout = {
      "Pre-Match": [{ key: "Presented", label: "Robot Present" }, { key: "AutoStartX", type: "startingPos" }],
    };

    // Copy over the rest of the layout
    for (const [header, keys] of Object.entries(layout)) {
      finalLayout[header] = keys;
    }

    const keys = Object.keys(layout);
    finalLayout[keys[keys.length - 1]]?.push("comments");

    return finalLayout;
  }

  public createQuantitativeFormData(): TQuantitativeFormData {
    return new this.quantitativeFormDataType();
  }

  public createPitReportData(): TPitReportData {
    return new this.pitReportDataType();
  }
}

export class Season {
  _id: string | undefined;
  name: string;
  slug: string | undefined;

  gameId: GameId;

  year: number;

  competitions: string[];

  constructor(
    name: string,
    slug: string | undefined,
    year: number,
    gameId: GameId = GameId.Crescendo,
    competitions: string[] = []
  ) {
    this.name = name;
    this.slug = slug;
    this.year = year;
    this.competitions = competitions;
    this.gameId = gameId;
  }
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

export abstract class PitReportData {
  [key: string]: any;

  image: string = "/robot.jpg";
  drivetrain: Drivetrain = Drivetrain.Tank;
  motorType: Motors = Motors.Talons;
  swerveLevel: SwerveLevel = SwerveLevel.None;
  comments: string = "";
}

export type PitReportLayoutElement<TPitData> = {
  [key: string]: any;

  key: keyof TPitData;
  label?: string;
  type?: "string" | "number" | "boolean" | "image" | Object | undefined;
}

export type PitReportLayout<TPitData extends PitReportData> = {
  [header: string]: Array<keyof TPitData | PitReportLayoutElement<TPitData>>;
}

export class Pitreport<TFormData extends PitReportData = PitReportData> {
  _id: string | undefined;

  teamNumber: number;

  submitted: boolean = false;
  submitter: string | undefined;

  data: TFormData | undefined;

  constructor(teamNumber: number, data: TFormData) {
    this.teamNumber = teamNumber;
    this.data = data;
  }
}

export class Competition {
  _id: string | undefined;
  name: string;
  slug: string | undefined;
  tbaId: string | undefined;

  gameId: GameId = GameId.Crescendo;

  publicData: boolean;

  start: number;
  end: number;

  pitReports: string[];
  matches: string[];

  picklist: string;

  constructor(
    name: string,
    slug: string | undefined,
    tbaId: string | undefined,
    start: number,
    end: number,
    pitReports: string[] = [],
    matches: string[] = [],
    picklist: string = "",
    publicData = false,
  ) {
    this.name = name;
    this.slug = slug;
    this.tbaId = tbaId;
    this.start = start;
    this.end = end;
    this.pitReports = pitReports;
    this.matches = matches;
    this.picklist = picklist;
    this.publicData = publicData;
  }
}

export enum AllianceColor {
  Red = "Red",
  Blue = "Blue",
}
export type Alliance = number[];

export enum MatchType {
  Qualifying = "Qualifying",
  Quarterfinals = "Quarterfinals",
  Semifinals = "Semifinals",
  Finals = "Finals",
}

// add more fields
export class Match {
  _id: string | undefined;
  slug: string | undefined;
  tbaId: string | undefined;

  type: MatchType;
  number: number;

  blueAlliance: Alliance;
  redAlliance: Alliance;

  time: number; // time the match begins
  reports: string[];

  subjectiveScouter: string | undefined;
  subjectiveReports: string[] = [];
  subjectiveReportsCheckInTimestamps: { [userId: string]: string } = {};
  assignedSubjectiveScouterHasSubmitted: boolean = false;

  constructor(
    number: number,
    slug: string | undefined,
    tbaId: string | undefined,
    time: number,
    type: MatchType,
    blueAlliance: Alliance,
    redAlliance: Alliance,
    reports: string[] = [],
  ) {
    this.number = number;
    this.tbaId = tbaId;
    this.time = time;
    this.type = type;

    this.blueAlliance = blueAlliance;
    this.redAlliance = redAlliance;
    this.reports = reports;
  }
}

export class Report<TFormData extends QuantitativeFormData = QuantitativeFormData>{
  _id: string | undefined;

  timestamp: number | undefined; // time it was initially submitted
  user: string | undefined; // id of user assigned to report
  submitter: string | undefined; // id of user who submitted the report

  color: AllianceColor;
  robotNumber: number; // number of robot to be reported
  match: string; // id of match

  submitted: boolean = false;
  data: TFormData;

  checkedIn: boolean = false;

  constructor(
    user: string | undefined,
    data: TFormData,
    robotNumber: number,
    color: AllianceColor,
    match: string,
    timestamp: number = 0,
    checkedIn: boolean
  ) {
    this.timestamp = timestamp;
    this.user = user;
    this.data = data;
    this.robotNumber = robotNumber;
    this.match = match;
    this.color = color;
    this.checkedIn = checkedIn;
  }
}

export type QuantitativeReportLayoutElement<TData extends QuantitativeFormData> = {
  [key: string]: any;

  key: keyof TData;
  label?: string;
  type?: "string" | "number" | "boolean" | "startingPos" | Object | undefined;
}

export type QuantitativeReportLayoutElementHolder<TData extends QuantitativeFormData> 
  = keyof TData | QuantitativeReportLayoutElement<TData> | (keyof TData | QuantitativeReportLayoutElement<TData>)[][];

export type QuantitativeReportLayout<TData extends QuantitativeFormData> = {
  /**
   * Use 2D array to make a block. Each array in the 2D array will be a column.
   */
  [page: string]: Array<QuantitativeReportLayoutElementHolder<TData>>;
}

export enum SubjectiveReportSubmissionType {
  ByAssignedScouter = "ByAssignedScouter",
  BySubjectiveScouter = "BySubjectiveScouter",
  ByNonSubjectiveScouter = "ByNonSubjectiveScouter",
  NotSubmitted = "NotSubmitted",
}

export class SubjectiveReport {
  _id: string | undefined;
  submitter: string | undefined;
  submitted: SubjectiveReportSubmissionType = SubjectiveReportSubmissionType.NotSubmitted;

  match: string; // id of match
  matchNumber: number;

  wholeMatchComment: string = "";
  robotComments: { [key: number]: string } = {};

  constructor(match: string, matchNumber: number) {
    this.match = match;
    this.matchNumber = matchNumber;
  }
}

export interface CompetitonNameIdPair {
  name: string;
  tbaId: string;
}

export interface EventData {
  comp: Competition;
  firstRanking: TheBlueAlliance.SimpleRank[];
  oprRanking: TheBlueAlliance.OprRanking;
}

export type DbPicklist = {
  _id: string;
  picklists: {
    [name: string]: number[];
  };
}