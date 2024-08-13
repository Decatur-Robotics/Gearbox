import { ObjectId } from "bson"
import CollectionId from "./client/CollectionId"
import { getDatabase } from "./MongoDB"
import { Account, Competition, DbPicklist, Match, OwnedByComp, OwnedByTeam, Pitreport, Report, Season, Session, SubjectiveReport, Team, User } from "./Types"

type Collection<TDocument> = {
  canRead: (userId: string, document: TDocument) => Promise<boolean> | boolean
  canWrite: (userId: string, document: TDocument, update: Partial<TDocument>) => Promise<boolean> | boolean
}

async function canReadOwnedByTeam<TDocument extends OwnedByTeam>(userId: string, document: TDocument) {
  const team = await getDatabase().then((db) => db.findObjectById<Team>(CollectionId.Teams, new ObjectId(document.ownerTeam)));

  return team?.users.includes(userId);
}

async function canReadOwnedByComp<TDocument extends OwnedByComp>(userId: string, document: TDocument) {
  const comp = getDatabase().then((db) => db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(document.ownerComp)));
  const canReadTeam = canReadOwnedByTeam(userId, document);

  return (await comp).publicData || await canReadTeam;
}

export const Collections: { [id in CollectionId]: Collection<any> } = {
  [CollectionId.Seasons]: {
    canRead: canReadOwnedByTeam
  } as Collection<Season>,
  [CollectionId.Competitions]: {
    canRead: canReadOwnedByTeam
  } as Collection<Competition>,
  [CollectionId.Matches]: {
    canRead: canReadOwnedByComp
  } as Collection<Match>,
  [CollectionId.Reports]: {
    canRead: canReadOwnedByComp
  } as Collection<Report>,
  [CollectionId.Teams]: {
    canRead: (userId, document) => true,
    canWrite: (userId, document, update) => 
    {
      return true;
    },
  } as Collection<Team>,
  [CollectionId.Users]: {} as Collection<User>,
  [CollectionId.Accounts]: {} as Collection<Account>,
  [CollectionId.Sessions]: {} as Collection<Session>,
  [CollectionId.Forms]: {} as Collection<unknown>,
  [CollectionId.Pitreports]: {
    canRead: canReadOwnedByComp
  } as Collection<Pitreport>,
  [CollectionId.Picklists]: {
    canRead: canReadOwnedByComp
  } as Collection<DbPicklist>,
  [CollectionId.SubjectiveReports]: {
    canRead: canReadOwnedByComp
  } as Collection<SubjectiveReport>,
  [CollectionId.SlackInstallations]: {} as Collection<unknown>,
}