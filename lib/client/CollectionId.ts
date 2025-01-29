import {
	Season,
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
} from "../Types";

enum CollectionId {
	Seasons = "Seasons",
	Competitions = "Competitions",
	Matches = "Matches",
	Reports = "Reports",
	Teams = "Teams",
	Users = "users",
	Accounts = "accounts",
	Sessions = "sessions",
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
