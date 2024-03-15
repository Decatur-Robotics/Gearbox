// A collection of all the standard types Gearbox uses
import {
  Account as NextAuthAccount,
  Session as NextAuthSession,
  User as NextAuthUser,
} from "next-auth";

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
    level: number = 1,
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
    requests: string[] = [],
    seasons: string[] = [],
  ) {
    this.name = name;
    this.slug = slug;
    this.tbaId = tbaId;
    this.number = number;
    this.owners = owners;
    this.users = users;
    this.scouters = scouters;
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
  Human = "Human",
  Ground = "Ground",
  Both = "Both",
}

export class FormData {
  AutoStartX: number = 0; // pixel position of robot
  AutoStartY: number = 0;
  AutoStartAngle: number = 0; // stored... but probably wont ever be used
  AutoScoredAmp: number = 0; // # of times scored in the amp
  AutoMissedAmp: number = 0;
  AutoScoredSpeaker: number = 0;
  AutoMissedSpeaker: number = 0;

  TeleopScoredAmp: number = 0;
  TeleopMissedAmp: number = 0;
  TeleopScoredSpeaker: number = 0;
  TeleopMissedSpeaker: number = 0;
  TeleopScoredTrap: number = 0;
  TeleopMissedTrap: number = 0;

  Defense: Defense = Defense.None;

  Coopertition: boolean = false; // true if used any point in match
  ClimbedStage: boolean = false;
  ParkedStage: boolean = false;
  UnderStage: boolean = false;

  IntakeType: IntakeTypes = IntakeTypes.Human;

  Comment: string = "";
}

export class Form {
  _id: string | undefined;
  name: string;
  data: FormData;

  constructor(name: string, data: FormData) {
    this.name = name;
    this.data = data;
  }
}

export class Season {
  _id: string | undefined;
  name: string;
  slug: string | undefined;

  year: number;

  competitions: string[];

  constructor(
    name: string,
    slug: string | undefined,
    year: number,
    competitions: string[] = [],
  ) {
    this.name = name;
    this.slug = slug;
    this.year = year;
    this.competitions = competitions;
  }
}

export class Competition {
  _id: string | undefined;
  name: string;
  slug: string | undefined;
  tbaId: string | undefined;

  start: number;
  end: number;

  teams: string[];
  matches: string[];

  constructor(
    name: string,
    slug: string | undefined,
    tbaId: string | undefined,
    start: number,
    end: number,
    teams: string[] = [],
    matches: string[] = [],
  ) {
    this.name = name;
    this.slug = slug;
    this.tbaId = tbaId;
    this.start = start;
    this.end = end;
    this.teams = teams;
    this.matches = matches;
  }
}

export enum AllianceColor {
  Red = "Red",
  Blue = "Blue",
}
export type Alliance = [];

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

  constructor(
    number: number,
    slug: string | undefined,
    tbaId: string | undefined,
    time: number,
    type: MatchType,
    blueAlliance: Alliance,
    redAlliance: Alliance,
    reports: string[] = [],
    scouters: string[] = [],
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

export class Report {
  _id: string | undefined;

  timestamp: number | undefined; // time it was initially submitted
  user: string | undefined; // id of user who submitted

  color: AllianceColor;
  robotNumber: number; // number of robot to be reported
  match: string; // id of match

  submitted: boolean = false;
  data: FormData;

  checkedIn: boolean = false;

  constructor(
    user: string | undefined,
    data: FormData,
    robotNumber: number,
    color: AllianceColor,
    match: string,
    timestamp: number = 0,
    checkedIn: boolean,
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

export interface CompetitonNameIdPair {
  name: string;
  tbaId: string;
}
