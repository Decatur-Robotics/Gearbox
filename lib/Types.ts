// A collection of all the standard types Gearbox uses
import {
  Account as NextAuthAccount,
  Session as NextAuthSession,
  User as NextAuthUser,
} from "next-auth";
import { TheBlueAlliance } from "./TheBlueAlliance";
import { GameId, defaultGameId } from "./client/GameId";
import { Defense, Drivetrain, Motors, SwerveLevel } from "./Enums";
import { FormLayoutProps, FormLayout, Badge, PitStatsLayout, StatsLayout } from './Layout';

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

  slackChannel: string | undefined;

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
    seasons: string[] = [],
    slackChannel: string | undefined = undefined
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
    this.slackChannel = slackChannel;
  }
}

export abstract class QuantData {
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
  FTC = "FTC", FRC = "FRC"
}

export class Game<TQuantData extends QuantData, TPitData extends PitReportData> {
  name: string;

  year: number;
  league: League;

  allianceSize: number

  quantDataType: new() => TQuantData;
  pitDataType: new() => TPitData;

  pitReportLayout: FormLayout<TPitData>;
  quantitativeReportLayout: FormLayout<TQuantData>;
  statsLayout: StatsLayout<TPitData, TQuantData>;
  pitStatsLayout: PitStatsLayout<TPitData, TQuantData>;

  fieldImagePrefix: string;
  coverImage: string

  getBadges: (pitData: Pitreport<TPitData> | undefined, quantitativeReports: Report<TQuantData>[] | undefined) => Badge[];
  getAvgPoints: (quantitativeReports: Report<TQuantData>[] | undefined) => number;

  /**
   * @param name 
   * @param year 
   * @param league 
   * @param quantDataType 
   * @param pitDataType 
   * @param pitReportLayout will auto-populate fields from PitReportData (everything not unique to the game)
   */
  constructor(name: string, year: number, league: League, 
      quantDataType: new() => TQuantData, pitDataType: new() => TPitData, 
      pitReportLayout: FormLayoutProps<TPitData>, quantitativeReportLayout: FormLayoutProps<TQuantData>,
      statsLayout: StatsLayout<TPitData, TQuantData>,
      pitStatsLayout: PitStatsLayout<TPitData, TQuantData>, fieldImagePrefix: string, 
      coverImage: string,
      getBadges: (pitData: Pitreport<TPitData> | undefined, quantitativeReports: Report<TQuantData>[] | undefined) => Badge[],
      getAvgPoints: (quantitativeReports: Report<TQuantData>[] | undefined) => number) {
    this.name = name;
    this.year = year;
    this.league = league;
    this.allianceSize = league === League.FRC ? 3 : 2;

    this.quantDataType = quantDataType;
    this.pitDataType = pitDataType;

    this.pitReportLayout = Game.mergePitLayoutWithBaseLayout(pitReportLayout, new pitDataType());
    this.quantitativeReportLayout = Game.mergeQuantitativeLayoutWithBaseLayout(quantitativeReportLayout, new quantDataType());
    this.statsLayout = Game.mergeStatsLayoutWithBaseLayout(statsLayout);
    this.pitStatsLayout = Game.mergePitStatsLayoutWithBaseLayout(pitStatsLayout);

    this.fieldImagePrefix = fieldImagePrefix;
    this.coverImage = coverImage;

    this.getBadges = getBadges;
    this.getAvgPoints = getAvgPoints;
  }

  private static mergePitLayoutWithBaseLayout<TData extends PitReportData>(layout: FormLayoutProps<TData>, exampleData: TData) {
    const finalLayout: typeof layout = {
      "Image": [{ key: "image", type: "image" }],
      "Drivetrain": ["drivetrain", "motorType", "swerveLevel"]
    }

    for (const [header, keys] of Object.entries(layout)) {
      finalLayout[header] = keys;
    }

    finalLayout["Comments"] = ["comments"];

    return FormLayout.fromProps(finalLayout, exampleData);
  }
  
  private static mergeQuantitativeLayoutWithBaseLayout<TData extends QuantData>(layout: FormLayoutProps<TData>, exampleData: TData) {
    const finalLayout: typeof layout = {
      "Pre-Match": [{ key: "Presented", label: "Robot Present" }, { key: "AutoStartX", type: "startingPos" }],
    };

    // Copy over the rest of the layout
    for (const [header, keys] of Object.entries(layout)) {
      finalLayout[header] = keys;
    }

    const keys = Object.keys(layout);
    finalLayout[keys[keys.length - 1]]?.push("comments");

    return FormLayout.fromProps(finalLayout, exampleData);
  }

  private static mergeStatsLayoutWithBaseLayout<TPitData extends PitReportData, TQuantData extends QuantData>
      (layout: StatsLayout<TPitData, TQuantData>) {
    const finalLayout: typeof layout = {
      "Positioning": [{label: "Avg Start X", key: "AutoStartX"}, {label: "Avg Start Y", key: "AutoStartY"}, 
        {label: "Avg Start Angle (Deg)", key: "AutoStartAngle"}],
    }

    for (const [header, stats] of Object.entries(layout)) {
      finalLayout[header] = stats;
    }

    return finalLayout;
  }

  private static mergePitStatsLayoutWithBaseLayout<TPitData extends PitReportData, TQuantData extends QuantData>
      (layout: PitStatsLayout<TPitData, TQuantData>) {
    const finalLayout: typeof layout = {
      overallSlideStats: [],
      individualSlideStats: [],
      robotCapabilities: [
        { key: "drivetrain", label: "Drivetrain" }
      ],
      graphStat: {
        key: "AutoStartX",
        label: "Avg Start X",
      }
    };

    for (const [key, value] of Object.entries(layout)) {
      if (!Array.isArray(value)) {
        finalLayout[key] = value;
      } else {
        (finalLayout[key] as []).push(...value as []);
      }
    }

    return finalLayout;
  }

  public createQuantitativeFormData(): TQuantData {
    return new this.quantDataType();
  }

  public createPitReportData(): TPitData {
    return new this.pitDataType();
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

export abstract class PitReportData {
  [key: string]: any;

  image: string = "/robot.jpg";
  drivetrain: Drivetrain = Drivetrain.Tank;
  motorType: Motors = Motors.Talons;
  swerveLevel: SwerveLevel = SwerveLevel.None;
  comments: string = "";
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
    gameId: GameId | undefined = undefined
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
    this.gameId = gameId ?? defaultGameId;
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

export class Report<TFormData extends QuantData = QuantData>{
  _id: string | undefined;

  timestamp: number | undefined; // time it was initially submitted
  user: string | undefined; // id of user assigned to report
  submitter: string | undefined; // id of user who submitted the report

  color: AllianceColor;
  robotNumber: number; // number of robot to be reported
  match: string; // id of match

  submitted: boolean = false;
  data: TFormData;

  checkInTimestamp: string | undefined;

  constructor(
    user: string | undefined,
    data: TFormData,
    robotNumber: number,
    color: AllianceColor,
    match: string,
    timestamp: number = 0,
    checkInTimestamp: string | undefined = undefined
  ) {
    this.timestamp = timestamp;
    this.user = user;
    this.data = data;
    this.robotNumber = robotNumber;
    this.match = match;
    this.color = color;
    this.checkInTimestamp = checkInTimestamp;
  }
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