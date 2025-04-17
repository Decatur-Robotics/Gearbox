import { NextApiResponse } from "next";
import { ObjectId } from "bson";
import {
	Competition,
	Match,
	Pitreport,
	Season,
	SubjectiveReport,
	User,
	Report,
} from "../Types";
import ApiDependencies from "../api/ApiDependencies";
import CollectionId from "../client/CollectionId";
import DbInterface from "../client/dbinterfaces/DbInterface";
import InMemoryDbInterface from "../client/dbinterfaces/InMemoryDbInterface";
import { ResendInterface } from "../ResendUtils";
import { SlackInterface } from "../SlackClient";
import { NextResponse } from "unified-api-nextjs";
import { RollbarInterface } from "../client/RollbarUtils";
import { BrowserContext, Page } from "@playwright/test";
import ClientApi from "../api/ClientApi";

export class TestRes extends NextResponse<any> {
	status = jest.fn((code) => this);
	send = jest.fn((obj) => this);
	error = jest.fn((code, message) => {
		this.status(code);
		this.send({ error: message });
		return this;
	});

	constructor(res?: NextApiResponse) {
		super(res ?? ({} as NextApiResponse));
	}
}

export class TestResend implements ResendInterface {
	createContact = jest.fn();
	emailDevelopers = jest.fn();
}

export class TestSlackClient implements SlackInterface {
	sendMsg = jest.fn(() => Promise.resolve());
}

function getTestUser() {
	return {
		_id: new ObjectId(),
		email: "",
		name: "",
		image: "",
		teams: [],
		owner: [],
	} as any as User;
}

export async function getTestApiUtils() {
	const db = new InMemoryDbInterface();
	db.init();

	const user = getTestUser();
	await db.addObject(CollectionId.Users, user);

	return {
		res: new TestRes(),
		db,
		resend: new TestResend(),
		user,
	};
}

export async function getTestApiParams<
	TArgs extends Array<any>,
	TAuthData = undefined,
>(
	res: TestRes,
	deps:
		| Partial<ApiDependencies>
		| Partial<{
				db: DbInterface;
				user: Partial<User>;
				resend: ResendInterface;
		  }>,
	args: TArgs,
	authData: TAuthData = undefined as any,
): Promise<[any, TestRes, ApiDependencies, TAuthData, any]> {
	let user = (deps as any).user ?? (deps as any).userPromise;
	const db = (await deps.db) ?? new InMemoryDbInterface();

	if (!user) {
		user = getTestUser();
		(deps as any).user = user;

		await db.addObject(CollectionId.Users, user);
	}

	return [
		{} as any,
		res,
		{
			db: Promise.resolve(db),
			slackClient: new TestSlackClient(),
			userPromise: Promise.resolve(user),
			tba: undefined,
			resend: deps.resend ?? new TestResend(),
			rollbar: getTestRollbar(),
			...deps,
		} as ApiDependencies,
		authData,
		args,
	];
}

export async function getTestAuthParams<TArgs extends Array<any>>(
	res: TestRes,
	deps:
		| Partial<ApiDependencies>
		| Partial<{
				db: DbInterface;
				user: Partial<User>;
				resend: ResendInterface;
		  }>,
	args: TArgs,
) {
	return (await getTestApiParams(res, deps, args, {})).slice(0, 4);
}

export function getTestRollbar(): RollbarInterface {
	return {
		error: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	};
}

/**
 * Creates a set of test documents for the database.
 * This includes a report, subjective report, match, pit report, competition, season, and team.
 */
export async function createTestDocuments(db: DbInterface) {
	const matchId = new ObjectId();

	const report = await db.addObject(CollectionId.Reports, {
		match: matchId.toString(),
	} as any as Report);

	const subjectiveReport = await db.addObject(
		CollectionId.SubjectiveReports,
		{} as any as SubjectiveReport,
	);

	const match = await db.addObject(CollectionId.Matches, {
		_id: matchId,
		reports: [report._id!.toString()],
		subjectiveReports: [subjectiveReport._id!.toString()],
	} as any as Match);

	const pitReport = await db.addObject(
		CollectionId.PitReports,
		{} as any as Pitreport,
	);

	const comp = await db.addObject(CollectionId.Competitions, {
		matches: [match._id!.toString()],
		pitReports: [pitReport._id!.toString()],
	} as any as Competition);

	const season = await db.addObject(CollectionId.Seasons, {
		competitions: [comp._id!.toString()],
	} as any as Season);

	const team = await db.addObject(CollectionId.Teams, {
		seasons: [season._id!.toString()],
	} as any as any);

	return { report, subjectiveReport, match, pitReport, comp, season, team };
}

export namespace PlaywrightUtils {
	/**
	 * You cannot use LocalStorage with the API returned this function!
	 */
	export function getTestClientApi() {
		const api = new ClientApi();

		// Relative requests don't work in Playwright apparently
		if (
			process.env.BASE_URL_FOR_PLAYWRIGHT &&
			!api.requestHelper.baseUrl.startsWith(process.env.BASE_URL_FOR_PLAYWRIGHT)
		) {
			api.requestHelper.baseUrl =
				process.env.BASE_URL_FOR_PLAYWRIGHT + api.requestHelper.baseUrl;
		}

		return api;
	}

	/**
	 * Will reload the page
	 */
	export async function signUp(page: Page) {
		const { sessionToken, user } = await getTestClientApi().testSignIn();

		if (!sessionToken || !user) {
			throw new Error("Failed to sign in");
		}

		await signIn(page, sessionToken);

		return {
			sessionToken,
			user,
		};
	}

	/**
	 * Will reload the page
	 */
	export async function signIn(page: Page, sessionToken: string) {
		await page.context().addCookies([
			{
				name: "next-auth.session-token",
				value: sessionToken,
				path: "/",
				domain: "localhost",
				sameSite: "Lax",
				httpOnly: true,
				secure: true,
				expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day expiration
			},
		]);

		// It sometimes requires a reload and a fetch to get sign ins to register
		await getUser(page);
		await page.reload();
	}

	export async function getUser(page: Page) {
		const res = await page.context().request.get("/api/auth/session");

		if (res.ok()) {
			const { user } = await res.json();
			return user as User;
		} else {
			throw new Error("Failed to get user");
		}
	}
}
