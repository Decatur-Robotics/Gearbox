// A collection of all the standard types Gearbox uses
import {
  Account as NextAuthAccount,
  Session as NextAuthSession,
  User as NextAuthUser,
} from "next-auth";
import { TheBlueAlliance } from "./TheBlueAlliance";
import { GameId, defaultGameId } from "./client/GameId";
import { Defense, FrcDrivetrain, Motors, SwerveLevel } from "./Enums";
import { FormLayoutProps, FormLayout, Badge, PitStatsLayout, StatsLayout } from './Layout';
import { ObjectId } from "bson";

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
  resendContactId: string | undefined = undefined;
  lastSignInDateTime: Date | undefined = undefined;

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

export class FieldPos {
  x: number = 0;
  y: number = 0;
  angle: number = 0;

  static Zero = new FieldPos();
}

export class Team {
  _id: ObjectId;
  name: string;
  slug: string | undefined;
  tbaId: string | undefined;
  number: number;
  league: League = League.FRC;

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
    league: League = League.FRC,
    owners: string[] = [],
    users: string[] = [],
    scouters: string[] = [],
    subjectiveScouters: string[] = [],
    requests: string[] = [],
    seasons: string[] = [],
    slackChannel: string | undefined = undefined
  ) {
    this._id = new ObjectId();
    this.name = name;
    this.slug = slug;
    this.tbaId = tbaId;
    this.number = number;
    this.league = league;
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

  AutoStart: FieldPos = FieldPos.Zero;

  Defense: Defense = Defense.None;

  drivetrain: FrcDrivetrain = FrcDrivetrain.Tank;

  comments: string = "";
}

export enum League {
  FTC = "FTC", FRC = "FRC"
}

export class Game<TQuantData extends QuantData = QuantData, TPitData extends PitReportData = PitReportData> {
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

  getBadges: (pitData: Pitreport<TPitData> | undefined, quantitativeReports: Report<TQuantData>[] | undefined, card: boolean) => Badge[];
  getAvgPoints: (quantitativeReports: Report<TQuantData>[] | undefined) => number;

  /**
   * @param name 
   * @param year 
   * @param league 
   * @param quantDataType 
   * @param pitDataType 
   * @param pitReportLayout will auto-populate fields from PitReportData (everything not unique to the game)
   */
  constructor(
      name: string, 
      year: number, 
      league: League, 
      quantDataType: new() => TQuantData, 
      pitDataType: new() => TPitData, 
      pitReportLayout: FormLayoutProps<TPitData>, 
      quantitativeReportLayout: FormLayoutProps<TQuantData>,
      statsLayout: StatsLayout<TPitData, TQuantData>,
      pitStatsLayout: PitStatsLayout<TPitData, TQuantData>, 
      fieldImagePrefix: string, 
      coverImage: string,
      getBadges: (pitData: Pitreport<TPitData> | undefined, quantitativeReports: Report<TQuantData>[] | undefined, card: boolean) => Badge[],
      getAvgPoints: (quantitativeReports: Report<TQuantData>[] | undefined) => number
    ) {
    this.name = name;
    this.year = year;
    this.league = league;
    this.allianceSize = league === League.FRC ? 3 : 2;

    this.quantDataType = quantDataType;
    this.pitDataType = pitDataType;

    this.pitReportLayout = Game.mergePitLayoutWithBaseLayout(pitReportLayout, new pitDataType(), league);
    this.quantitativeReportLayout = Game.mergeQuantitativeLayoutWithBaseLayout(league, quantitativeReportLayout, new quantDataType());
    this.statsLayout = Game.mergeStatsLayoutWithBaseLayout(statsLayout);
    this.pitStatsLayout = Game.mergePitStatsLayoutWithBaseLayout(pitStatsLayout);

    this.fieldImagePrefix = fieldImagePrefix;
    this.coverImage = coverImage;

    this.getBadges = getBadges;
    this.getAvgPoints = getAvgPoints;
  }

  private static mergePitLayoutWithBaseLayout<TData extends PitReportData>(layout: FormLayoutProps<TData>, exampleData: TData, league: League) {
    const finalLayout: typeof layout = {
      "Image": [{ key: "image", type: "image" }],
      "Drivetrain": ["drivetrain"]
    }

    if (league === League.FRC)
      finalLayout["Drivetrain"].push("motorType", "swerveLevel");

    for (const [header, keys] of Object.entries(layout)) {
      finalLayout[header] = keys;
    }

    finalLayout["Comments"] = ["comments"];

    return FormLayout.fromProps(league, finalLayout, exampleData);
  }
  
  private static mergeQuantitativeLayoutWithBaseLayout<TData extends QuantData>(league: League, layout: FormLayoutProps<TData>, exampleData: TData) {
    const finalLayout: typeof layout = {
      "Pre-Match": [{ key: "Presented", label: "Robot Present" }, { key: "AutoStartX", type: "startingPos" }],
    };

    // Copy over the rest of the layout
    for (const [header, keys] of Object.entries(layout)) {
      if (header === "Pre-Match") finalLayout["Pre-Match"].push(...keys);
      else finalLayout[header] = keys;
    }

    const keys = Object.keys(layout);
    finalLayout[keys[keys.length - 1]]?.push("comments");

    return FormLayout.fromProps(league, finalLayout, exampleData);
  }

  private static mergeStatsLayoutWithBaseLayout<TPitData extends PitReportData, TQuantData extends QuantData>
      (layout: StatsLayout<TPitData, TQuantData>): StatsLayout<TPitData, TQuantData> {
    const finalSections: typeof layout.sections = {
      "Positioning": [{label: "Avg Start X", key: "AutoStartX"}, {label: "Avg Start Y", key: "AutoStartY"}, 
        {label: "Avg Start Angle (Deg)", key: "AutoStartAngle"}],
    }

    for (const [header, stats] of Object.entries(layout.sections)) {
      finalSections[header] = stats;
    }

    return { sections: finalSections, getGraphDots: layout.getGraphDots };
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
  drivetrain: FrcDrivetrain = FrcDrivetrain.Tank;
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

/**
 * Holds all data involved in a competition so it can be used offline.
 */
export class SavedCompetition {
  comp: Competition;
  game: Game<QuantData, PitReportData>;

  lastAccessTime: number = Date.now();

  team: Team;
  seasonSlug: string | undefined;

  matches: { [_id: string]: Match };
  quantReports: { [_id: string]: Report<QuantData> };
  subjectiveReports: { [_id: string]: SubjectiveReport };
  pitReports: { [_id: string]: Pitreport<PitReportData> };

  picklists: DbPicklist | undefined;

  users: { [_id: string]: User };

  constructor(comp: Competition, game: Game<QuantData, PitReportData>, team: Team, users: { [_id: string]: User } = {}, seasonSlug: string | undefined = undefined, matches: { [_id: string]: Match } = {},
      quantReports: { [_id: string]: Report<QuantData> } = {}, subjectiveReports: { [_id: string]: SubjectiveReport } = {},
      pitReports: { [_id: number]: Pitreport<PitReportData> } = {}, picklists: DbPicklist | undefined = undefined
  ) {
    this.comp = comp;
    this.game = game;
    
    this.team = team;
    this.users = users;

    this.seasonSlug = seasonSlug;

    this.matches = matches;
    this.quantReports = quantReports;
    this.subjectiveReports = subjectiveReports;
    this.pitReports = pitReports;

    this.picklists = picklists;
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

type LinkedNode<T> = T & {
  prev?: LinkedNode<T>;
  next?: LinkedNode<T>;
}

/**
 * @tested_by tests/lib/Types.test.ts
 */
export class LinkedList<T> {
  private head?: LinkedNode<T> = undefined;

  constructor(head?: T | T[]) {
    if (Array.isArray(head) && head.length > 0) {
      let node: LinkedNode<T>;

      for (const element of head) {
        if (!this.head) {
          this.head = {
            ...element,
            next: undefined,
            prev: undefined
          }

          node = this.head;
        } else node = this.insertAfter(node!, element);
      }
    } else if (head)
      this.head = {
        ...head as T,
        next: undefined,
        prev: undefined
      };
  }

  size() {
    let count = 0;

    for (let node = this.head; node !== undefined; node = node.next)
      count++;

    return count;
  }

  isEmpty() {
    return this.head === undefined;
  }

  first() {
    return this.head;
  }

  last() {
    let node = this.head;
    while (node?.next)
      node = node.next;

    return node;
  }

  // Add to criterion B
  /**
   * Will reset the list to just be head
   */
  setHead(insertedVal: T) {
    this.head = {
      ...insertedVal,
      prev: undefined,
      next: undefined
    };
  }

  insertBefore(existingNode: LinkedNode<T>, insertedVal: T) {
    const insertedNode: LinkedNode<T> = {
      ...insertedVal,
      next: existingNode,
    }

    if (existingNode.prev) {
      existingNode.prev.next = insertedNode;
      insertedNode.prev = existingNode.prev;
    }
    existingNode.prev = insertedNode;

    if (this.head === existingNode)
      this.head = insertedNode;

    return insertedNode;
  }

  insertAfter(existingNode: LinkedNode<T>, insertedVal: T) {
    const insertedNode: LinkedNode<T> = {
      ...insertedVal,
      prev: existingNode
    }

    if (existingNode.next) {
      existingNode.next.prev = insertedNode;
      insertedNode.next = existingNode.next;
    }
    existingNode.next = insertedNode;

    return insertedNode;
  }

  // Add to criterion B
  forEach(func: (node: LinkedNode<T>) => any) {
    for (let node = this.head; node; node = node.next) {
      func(node);
    }
  }

  // Add to criterion B
  map<TMap>(func: (node: LinkedNode<T>) => TMap) {
    const array: TMap[] = [];
    
    for (let node = this.head; node; node = node.next) {
      array.push(func(node));
    }

    return array;
  }
}

/**
 * Taken from https://stackoverflow.com/a/62502740/22099600
 */
export type OmitCallSignature<T> =
  { [K in keyof T]: T[K] } &
  (T extends new (...args: infer R) => infer S ? new (...args: R) => S : unknown)