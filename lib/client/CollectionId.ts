import { VerificationToken } from "next-auth/adapters";
import {
	Competition,
	Match,
	SubjectiveReport,
	Team,
	Report,
	User,
	Account,
	Session,
	Pitreport,
	CompPicklistGroup,
	WebhookHolder,
	Season,
} from "../Types";
import { ObjectId } from "bson";

enum CollectionId {
	Seasons = "Seasons",
	Competitions = "Competitions",
	Matches = "Matches",
	Reports = "Reports",
	Teams = "Teams",
	Users = "users",
	Accounts = "accounts",
	Sessions = "sessions",
	VerificationTokens = "verification_tokens",
	Forms = "Forms",
	PitReports = "Pitreports",
	Picklists = "Picklists",
	SubjectiveReports = "SubjectiveReports",
	SlackInstallations = "SlackInstallations",
	Webhooks = "Webhooks",
	Misc = "Misc",
}

// We can't do export default enum CollectionId
export default CollectionId;

export type CollectionIdToType<Id extends CollectionId> =
	Id extends CollectionId.Seasons
		? Season
		: Id extends CollectionId.Competitions
			? Competition
			: Id extends CollectionId.Matches
				? Match
				: Id extends CollectionId.Reports
					? Report
					: Id extends CollectionId.Teams
						? Team
						: Id extends CollectionId.Users
							? User
							: Id extends CollectionId.Accounts
								? Account
								: Id extends CollectionId.Sessions
									? Session
									: Id extends CollectionId.VerificationTokens
										? VerificationToken & { _id: ObjectId }
										: Id extends CollectionId.PitReports
											? Pitreport
											: Id extends CollectionId.Picklists
												? CompPicklistGroup
												: Id extends CollectionId.SubjectiveReports
													? SubjectiveReport
													: Id extends CollectionId.Webhooks
														? WebhookHolder
														: Id extends CollectionId.Misc
															? any
															: any;

export type TypeToCollectionId<Type> = Type extends Season
	? CollectionId.Seasons
	: Type extends Competition
		? CollectionId.Competitions
		: Type extends Match
			? CollectionId.Matches
			: Type extends Report
				? CollectionId.Reports
				: Type extends Team
					? CollectionId.Teams
					: Type extends User
						? CollectionId.Users
						: Type extends Account
							? CollectionId.Accounts
							: Type extends Session
								? CollectionId.Sessions
								: Type extends VerificationToken
									? CollectionId.VerificationTokens
									: Type extends Pitreport
										? CollectionId.PitReports
										: Type extends CompPicklistGroup
											? CollectionId.Picklists
											: Type extends SubjectiveReport
												? CollectionId.SubjectiveReports
												: Type extends WebhookHolder
													? CollectionId.Webhooks
													: Type extends any
														? CollectionId.Misc
														: any;

export type SluggedCollectionId =
	| CollectionId.Users
	| CollectionId.Teams
	| CollectionId.Seasons
	| CollectionId.Competitions;
