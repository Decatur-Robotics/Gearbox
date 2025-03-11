// A collection of all the standard types Gearbox uses
import {
	Account as NextAuthAccount,
	Session as NextAuthSession,
	User as NextAuthUser,
} from "next-auth";
import { TheBlueAlliance } from "./TheBlueAlliance";
import { GameId, defaultGameId } from "./client/GameId";
import { Defense, FrcDrivetrain, Motors, SwerveLevel } from "./Enums";
import {
	FormLayoutProps,
	FormLayout,
	Badge,
	PitStatsLayout,
	StatsLayout,
} from "./Layout";
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
	sessionToken: string;
	userId: ObjectId;
	expires: string;
}

export class User implements NextAuthUser {
	id: string = "";
	_id: ObjectId;
	name: string | undefined;
	email: string | undefined;
	image: string;
	admin: boolean;
	slug: string | undefined;
	teams: ObjectId[];
	owner: ObjectId[];
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
		teams: ObjectId[] = [],
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
	alliance: boolean;

	owners: ObjectId[];
	users: ObjectId[];
	scouters: ObjectId[];
	subjectiveScouters: ObjectId[];
	requests: ObjectId[];

	seasons: ObjectId[];

	/**
	 * ID of the WebhookHolder object
	 * @see WebhookHolder
	 */
	slackWebhook: ObjectId | undefined;

	constructor(
		name: string,
		slug: string | undefined,
		tbaId: string | undefined,
		number: number,
		league: League = League.FRC,
		alliance: boolean = false,
		owners: string[] = [],
		users: string[] = [],
		scouters: string[] = [],
		subjectiveScouters: string[] = [],
		requests: string[] = [],
		seasons: string[] = [],
	) {
		this._id = new ObjectId();
		this.name = name;
		this.slug = slug;
		this.tbaId = tbaId;
		this.number = number;
		this.league = league;
		this.alliance = alliance;
		this.owners = owners;
		this.users = users;
		this.scouters = scouters;
		this.subjectiveScouters = subjectiveScouters;
		this.seasons = seasons;
		this.requests = requests;
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
	FTC = "FTC",
	FRC = "FRC",
}

export class Game<
	TQuantData extends QuantData = QuantData,
	TPitData extends PitReportData = PitReportData,
> {
	name: string;

	year: number;
	league: League;

	allianceSize: number;

	quantDataType: new () => TQuantData;
	pitDataType: new () => TPitData;

	pitReportLayout: FormLayout<TPitData>;
	quantitativeReportLayout: FormLayout<TQuantData>;
	statsLayout: StatsLayout<TPitData, TQuantData>;
	pitStatsLayout: PitStatsLayout<TPitData, TQuantData>;

	fieldImagePrefix: string;
	coverImage: string;
	coverImageClass: string;

	getBadges: (
		pitData: Pitreport<TPitData> | undefined,
		quantitativeReports: Report<TQuantData>[] | undefined,
		card: boolean,
	) => Badge[];
	getAvgPoints: (
		quantitativeReports: Report<TQuantData>[] | undefined,
	) => number;

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
		quantDataType: new () => TQuantData,
		pitDataType: new () => TPitData,
		pitReportLayout: FormLayoutProps<TPitData>,
		quantitativeReportLayout: FormLayoutProps<TQuantData>,
		statsLayout: StatsLayout<TPitData, TQuantData>,
		pitStatsLayout: PitStatsLayout<TPitData, TQuantData>,
		fieldImagePrefix: string,
		coverImage: string,
		coverImageClass: string | undefined,
		getBadges: (
			pitData: Pitreport<TPitData> | undefined,
			quantitativeReports: Report<TQuantData>[] | undefined,
			card: boolean,
		) => Badge[],
		getAvgPoints: (
			quantitativeReports: Report<TQuantData>[] | undefined,
		) => number,
	) {
		this.name = name;
		this.year = year;
		this.league = league;
		this.allianceSize = league === League.FRC ? 3 : 2;

		this.quantDataType = quantDataType;
		this.pitDataType = pitDataType;

		this.pitReportLayout = Game.mergePitLayoutWithBaseLayout(
			pitReportLayout,
			new pitDataType(),
			league,
		);
		this.quantitativeReportLayout = Game.mergeQuantitativeLayoutWithBaseLayout(
			league,
			quantitativeReportLayout,
			new quantDataType(),
		);
		this.statsLayout = Game.mergeStatsLayoutWithBaseLayout(statsLayout);
		this.pitStatsLayout =
			Game.mergePitStatsLayoutWithBaseLayout(pitStatsLayout);

		this.fieldImagePrefix = fieldImagePrefix;
		this.coverImage = coverImage;
		this.coverImageClass = coverImageClass ?? "";

		this.getBadges = getBadges;
		this.getAvgPoints = getAvgPoints;
	}

	private static mergePitLayoutWithBaseLayout<TData extends PitReportData>(
		layout: FormLayoutProps<TData>,
		exampleData: TData,
		league: League,
	) {
		const finalLayout: typeof layout = {
			Image: [{ key: "image", type: "image" }],
			Drivetrain: ["drivetrain"],
		};

		if (league === League.FRC)
			finalLayout["Drivetrain"].push("motorType", "swerveLevel");

		for (const [header, keys] of Object.entries(layout)) {
			finalLayout[header] = keys;
		}

		finalLayout["Comments"] = ["comments"];

		return FormLayout.fromProps(league, finalLayout, exampleData);
	}

	private static mergeQuantitativeLayoutWithBaseLayout<TData extends QuantData>(
		league: League,
		layout: FormLayoutProps<TData>,
		exampleData: TData,
	) {
		const finalLayout: typeof layout = {
			"Pre-Match": [
				{ key: "Presented", label: "Robot Present" },
				{ key: "AutoStartX", type: "startingPos" },
			],
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

	private static mergeStatsLayoutWithBaseLayout<
		TPitData extends PitReportData,
		TQuantData extends QuantData,
	>(
		layout: StatsLayout<TPitData, TQuantData>,
	): StatsLayout<TPitData, TQuantData> {
		const finalSections: typeof layout.sections = {
			Positioning: [
				{ label: "Avg Start X", key: "AutoStartX" },
				{ label: "Avg Start Y", key: "AutoStartY" },
				{ label: "Avg Start Angle (Deg)", key: "AutoStartAngle" },
			],
		};

		for (const [header, stats] of Object.entries(layout.sections)) {
			finalSections[header] = stats;
		}

		return { sections: finalSections, getGraphDots: layout.getGraphDots };
	}

	private static mergePitStatsLayoutWithBaseLayout<
		TPitData extends PitReportData,
		TQuantData extends QuantData,
	>(layout: PitStatsLayout<TPitData, TQuantData>) {
		const finalLayout: typeof layout = {
			overallSlideStats: [],
			individualSlideStats: [],
			robotCapabilities: [{ key: "drivetrain", label: "Drivetrain" }],
			graphStat: {
				key: "AutoStartX",
				label: "Avg Start X",
			},
		};

		for (const [key, value] of Object.entries(layout)) {
			if (!Array.isArray(value)) {
				finalLayout[key] = value;
			} else {
				(finalLayout[key] as []).push(...(value as []));
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
		competitions: string[] = [],
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
	_id: ObjectId;

	teamNumber: number;

	submitted: boolean = false;
	submitter: ObjectId | undefined;

	data: TFormData | undefined;

	constructor(teamNumber: number, data: TFormData) {
		this.teamNumber = teamNumber;
		this.data = data;
	}
}

export class Competition {
	_id: ObjectId;
	name: string;
	slug: string | undefined;
	tbaId: string | undefined;

	gameId: GameId = GameId.Crescendo;

	publicData: boolean;

	start: number;
	end: number;

	pitReports: ObjectId[];
	matches: ObjectId[];

	picklist: ObjectId;

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
		gameId: GameId | undefined = undefined,
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
	_id: ObjectId;
	slug: string | undefined;
	tbaId: string | undefined;

	type: MatchType;
	number: number;

	blueAlliance: Alliance;
	redAlliance: Alliance;

	time: number; // time the match begins
	reports: ObjectId[];

	subjectiveScouter: ObjectId | undefined;
	subjectiveReports: ObjectId[] = [];
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

export class Report<TFormData extends QuantData = QuantData> {
	_id: ObjectId;

	timestamp: number | undefined; // time it was initially submitted
	user: ObjectId | undefined; // id of user assigned to report
	submitter: ObjectId | undefined; // id of user who submitted the report

	color: AllianceColor;
	robotNumber: number; // number of robot to be reported
	match: ObjectId; // id of match

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
		checkInTimestamp: string | undefined = undefined,
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
	_id: ObjectId;
	submitter: ObjectId | undefined;
	submitted: SubjectiveReportSubmissionType =
		SubjectiveReportSubmissionType.NotSubmitted;

	match: ObjectId; // id of match
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

export type CompPicklistGroup = {
	_id: ObjectId;
	picklists: {
		[name: string]: number[];
	};
	strikethroughs: number[];
};

type LinkedNode<T> = T & {
	prev?: LinkedNode<T>;
	next?: LinkedNode<T>;
};

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
						prev: undefined,
					};

					node = this.head;
				} else node = this.insertAfter(node!, element);
			}
		} else if (head)
			this.head = {
				...(head as T),
				next: undefined,
				prev: undefined,
			};
	}

	size() {
		let count = 0;

		for (let node = this.head; node !== undefined; node = node.next) count++;

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
		while (node?.next) node = node.next;

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
			next: undefined,
		};
	}

	insertBefore(existingNode: LinkedNode<T>, insertedVal: T) {
		const insertedNode: LinkedNode<T> = {
			...insertedVal,
			next: existingNode,
		};

		if (existingNode.prev) {
			existingNode.prev.next = insertedNode;
			insertedNode.prev = existingNode.prev;
		}
		existingNode.prev = insertedNode;

		if (this.head === existingNode) this.head = insertedNode;

		return insertedNode;
	}

	insertAfter(existingNode: LinkedNode<T>, insertedVal: T) {
		const insertedNode: LinkedNode<T> = {
			...insertedVal,
			prev: existingNode,
		};

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
 * DO NOT GIVE TO CLIENTS!
 */
export class WebhookHolder {
	_id: ObjectId;
	url: string;

	constructor(url: string) {
		this._id = new ObjectId();
		this.url = url;
	}
}

export type LeaderboardUser = {
	_id: ObjectId;
	name: string;
	image: string;
	xp: number;
	level: number;
	teams: string[];
};

export type LeaderboardTeam = {
	_id: ObjectId;
	name: string;
	number: number;
	league: League;
	xp: number;
};
