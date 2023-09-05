// A collection of all the standard types Gearbox uses
import { Account as NextAuthAccount, Session as NextAuthSession, User as NextAuthUser} from "next-auth";

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
};

export interface Session extends NextAuthSession {
    _id: string;
};

export class User implements NextAuthUser {
    id: string  = ""
    _id: string | undefined;
    name: string | undefined;
    email: string | undefined;
    image: string;
    admin: boolean;
    slug: string | undefined;
    teams: string[];
    owner: string[];

    constructor(name:string|undefined, email:string|undefined, image: string = process.env.DEFAULT_IMAGE, admin: boolean=false, slug:string | undefined, teams: string[]=[], owner: string[]=[]) {
        this.name = name;
        this.email = email;
        this.image = image;
        this.admin = admin;
        this.slug = slug;
        this.teams = teams;
        this.owner = owner;
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

    constructor(name: string,  slug: string | undefined, tbaId: string | undefined, number: number, owners: string[]=[], users: string[]=[], scouters: string[]=[], requests: string[]=[], seasons: string[]=[]) {
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

export enum FormElementType {
    Number="Number",
    Text="Text",
    Boolean="Boolean",
}

export interface FormElement {
    ref: string,
    text: string,
    type: FormElementType;
    value: any;
}

export class Form {
    _id: string | undefined;
    name: string;
    data: FormElement[]; // JSON string;

    constructor(name: string, data: FormElement[]=[]) {
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

    forms: string[];

    constructor(name: string, slug: string | undefined, year: number, competitions: string[]=[], forms: string[]=[]) {
        this.name = name;
        this.slug = slug;
        this.year = year;
        this.competitions = competitions;
        this.forms = forms;
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

    constructor(name: string, slug: string | undefined, tbaId: string | undefined, start: number, end: number, teams: string[]=[], matches: string[]=[]) {
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
    Red="Red",
    Blue="Blue",
}
export type Alliance = []

export enum MatchType {
    Qualifying="Qualifying",
    Quarterfinals="Quarterfinals",
    Semifinals="Semifinals",
    Finals="Finals"
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

    constructor(number: number, slug: string | undefined, tbaId: string | undefined,  time: number, type: MatchType, blueAlliance: Alliance, redAlliance: Alliance,  reports: string[]=[], scouters: string[]=[]) {
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

    form: string; // id of form;

    color: AllianceColor;
    robotNumber: number; // number of robot to be reported
    match: string; // id of match

    submitted: boolean = false;
    data: Form | undefined;

    constructor(user: string | undefined, form: string, robotNumber: number, color: AllianceColor, match: string, timestamp: number | undefined=0, data: Form | undefined) {
        this.timestamp = timestamp;
        this.user = user;
        this.form = form;
        this.robotNumber = robotNumber;
        this.match = match;
        this.color = color;
        this.data = data;
    }
}

export interface CompetitonNameIdPair {
    name: string,
    tbaId: string,
}