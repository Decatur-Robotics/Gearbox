import { NextApiRequest } from "next";
import {
	Competition,
	CompPicklistGroup,
	Match,
	Pitreport,
	Report,
	Season,
	SubjectiveReport,
	Team,
	User,
} from "../Types";
import CollectionId from "../client/CollectionId";
import { ObjectId } from "bson";
import {
	getCompFromMatch,
	getCompFromPitReport,
	getTeamFromComp,
	getTeamFromPicklist,
	getTeamFromReport,
	getTeamFromSeason,
	getTeamFromSubjectiveReport,
} from "./ApiUtils";
import DbInterface from "../client/dbinterfaces/DbInterface";
import { isDeveloper } from "../Utils";
import { NextResponse } from "unified-api-nextjs";

type UserAndDb = {
	userPromise: Promise<User | undefined>;
	db: Promise<DbInterface>;
};

namespace AccessLevels {
	export function AlwaysAuthorized() {
		return Promise.resolve({ authorized: true, authData: undefined });
	}

	export async function IfSignedIn(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise }: UserAndDb,
	) {
		return {
			authorized: (await userPromise) != undefined,
			authData: undefined,
		};
	}

	export async function IfDeveloper(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise }: UserAndDb,
	) {
		const user = await userPromise;
		return { authorized: isDeveloper(user?.email), authData: undefined };
	}

	export async function IfOnTeam(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		teamId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const team = await (
			await db
		).findObjectById(CollectionId.Teams, new ObjectId(teamId));
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.users.includes(user._id),
			authData: team,
		};
	}

	export async function IfTeamOwner(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		teamId: ObjectId,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const team = await (
			await db
		).findObjectById(CollectionId.Teams, new ObjectId(teamId));
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.owners.includes(user._id),
			authData: team,
		};
	}

	export async function IfCompOwner(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		compId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const comp = await (
			await db
		).findObjectById(CollectionId.Competitions, new ObjectId(compId));
		if (!comp) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromComp(await db, comp);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.owners.includes(user._id),
			authData: { team, comp },
		};
	}

	export async function IfSeasonOwner(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		seasonId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const season = await (
			await db
		).findObjectById(CollectionId.Seasons, new ObjectId(seasonId));
		if (!season) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromSeason(await db, season);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.owners.includes(user._id),
			authData: { team, season },
		};
	}

	export async function IfMatchOwner(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		matchId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const match = await (
			await db
		).findObjectById(CollectionId.Matches, new ObjectId(matchId));
		if (!match) {
			return { authorized: false, authData: undefined };
		}

		const comp = await getCompFromMatch(await db, match);
		if (!comp) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromComp(await db, comp);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.owners.includes(user._id),
			authData: { team, comp, match },
		};
	}

	export async function IfReportOwner(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		reportId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const report = await (
			await db
		).findObjectById(CollectionId.Reports, new ObjectId(reportId));
		if (!report) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromReport(await db, report);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.owners.includes(user._id),
			authData: { team, report },
		};
	}

	export async function IfOnTeamThatOwnsComp(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		compId: ObjectId,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const comp = await (
			await db
		).findObjectById(CollectionId.Competitions, new ObjectId(compId));
		if (!comp) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromComp(await db, comp);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.users.includes(user._id),
			authData: { team, comp },
		};
	}

	export async function IfOnTeamThatOwnsMatch(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		matchId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const match = await (
			await db
		).findObjectById(CollectionId.Matches, new ObjectId(matchId));
		if (!match) {
			return { authorized: false, authData: undefined };
		}

		const comp = await getCompFromMatch(await db, match);
		if (!comp) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromComp(await db, comp);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.users.includes(user._id),
			authData: { team, comp, match },
		};
	}

	export async function IfOnTeamThatOwnsPitReport(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		pitReportId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const pitReport = await (
			await db
		).findObjectById(CollectionId.PitReports, new ObjectId(pitReportId));
		if (!pitReport) {
			return { authorized: false, authData: undefined };
		}

		const comp = await getCompFromPitReport(await db, pitReport);
		if (!comp) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromComp(await db, comp);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team?.users.includes(user._id),
			authData: { team, comp, pitReport },
		};
	}

	export async function IfOnTeamThatOwnsReport(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		reportId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const report = await (
			await db
		).findObjectById(CollectionId.Reports, new ObjectId(reportId));
		if (!report) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromReport(await db, report);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.users.includes(user._id),
			authData: { team, report },
		};
	}

	export async function IfOnTeamThatOwnsSubjectiveReport(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		reportId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const report = await (
			await db
		).findObjectById(CollectionId.SubjectiveReports, new ObjectId(reportId));
		if (!report) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromSubjectiveReport(await db, report);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.users.includes(user._id),
			authData: { team, report },
		};
	}

	export async function IfOnTeamThatOwnsPicklist(
		req: NextApiRequest,
		res: NextResponse<any>,
		{ userPromise, db }: UserAndDb,
		picklistId: string,
	) {
		const user = await userPromise;
		if (!user) {
			return { authorized: false, authData: undefined };
		}

		const picklist = await (
			await db
		).findObjectById(CollectionId.Picklists, new ObjectId(picklistId));
		if (!picklist) {
			return { authorized: false, authData: undefined };
		}

		const team = await getTeamFromPicklist(await db, picklist);
		if (!team) {
			return { authorized: false, authData: undefined };
		}

		return {
			authorized: team.users.includes(user._id),
			authData: { team, picklist },
		};
	}
}

export default AccessLevels;
