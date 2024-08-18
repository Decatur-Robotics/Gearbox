import { ObjectId } from "bson"
import CollectionId from "./client/CollectionId"
import { Account, Competition, DbPicklist, Match, OwnedByComp, OwnedByTeam, Pitreport, Report, Season, Session, SubjectiveReport, Team, User } from "./Types"
import DbInterface from "./client/DbInterface"

class Collection<TDocument> {
  canRead: (userId: string, document: TDocument, db: DbInterface) => Promise<boolean>
  canWrite: (userId: string, document: TDocument, update: Partial<TDocument>, db: DbInterface) => Promise<boolean>

  constructor(
      canRead: (userId: string, document: TDocument, db: DbInterface) => Promise<boolean>, 
      canWrite: (userId: string, document: TDocument, update: Partial<TDocument>, db: DbInterface) => Promise<boolean>
    ) {
    this.canRead = canRead;
    this.canWrite = canWrite;
  }
}

namespace AccessLevels {
  export namespace Read {
    export async function ifOnOwnerTeam<TDocument extends OwnedByTeam | Team>(userId: string, document: TDocument, db: DbInterface) {
      const team = "ownerTeam" in document
        ? db.findObjectById<Team>(CollectionId.Teams, new ObjectId(document.ownerTeam))
        : Promise.resolve(document as Team);

      if (!("ownerTeam" in document) && !("users" in document)) {
        // console.error("Used ifOnOwnerTeam access level for a document that doesn't have an ownerTeam or users field!");
        return true;
      }

      return (await team)?.users?.includes(userId);
    }

    export async function ifOnOwnerTeamOrCompIsPublic<TDocument extends OwnedByComp | Competition>(userId: string, document: TDocument, 
        db: DbInterface) {
      const comp = "ownerComp" in document 
        ? db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(document.ownerComp))
        : Promise.resolve(document as Competition);
      const canReadTeam = ifOnOwnerTeam(userId, document, db);

      return (await comp).publicData || await canReadTeam;
    }

    export async function never() {
      return false;
    }

    export async function always() {
      return true;
    }
  }

  export namespace Write {
    export async function ifOnOwnerTeam<TDocument extends OwnedByTeam>(userId: string, document: TDocument, update: Partial<TDocument>, 
        db: DbInterface) {
      return Read.ifOnOwnerTeam(userId, document, db);
    }
    
    export async function ifOnOwnerTeamOrCompIsPublic<TDocument extends OwnedByComp | Competition>(userId: string, document: TDocument, 
        update: Partial<TDocument>, db: DbInterface) {
      return Read.ifOnOwnerTeamOrCompIsPublic(userId, document, db);
    }

    export async function ifOnOwnerTeamOrQueryIsLimitedToKeys<TDocument extends OwnedByTeam | Team>(
        userId: string, document: TDocument, query: any, db: DbInterface, allowedKeys: (keyof TDocument)[]) {
      const isOnTeam = Read.ifOnOwnerTeam(userId, document, query);

      return isOnTeam || Object.keys(query).every(key => allowedKeys.includes(key as keyof TDocument));
    }

    export async function always() {
      return true;
    }

    export async function never() {
      return false;
    }
  }
}

export const Collections: { [id in CollectionId]: Collection<any> } = {
  [CollectionId.Seasons]: new Collection<Season>(
    AccessLevels.Read.ifOnOwnerTeam, 
    AccessLevels.Write.ifOnOwnerTeam
  ),
  [CollectionId.Competitions]: new Collection<Competition>(
    AccessLevels.Read.ifOnOwnerTeamOrCompIsPublic, 
    AccessLevels.Write.ifOnOwnerTeam
  ),
  [CollectionId.Matches]: new Collection<Match>(
    AccessLevels.Read.ifOnOwnerTeamOrCompIsPublic, 
    AccessLevels.Write.ifOnOwnerTeam
  ),
  [CollectionId.Reports]: new Collection<Report>(
    AccessLevels.Read.ifOnOwnerTeamOrCompIsPublic, 
    AccessLevels.Write.ifOnOwnerTeam
  ),
  [CollectionId.Teams]: new Collection<Team>(
    AccessLevels.Read.always, 
    (...args) => AccessLevels.Write.ifOnOwnerTeamOrQueryIsLimitedToKeys(...args, ["requests"])
  ),
  [CollectionId.Users]: new Collection<User>(
    AccessLevels.Read.always,
    AccessLevels.Write.always
  ),
  [CollectionId.Accounts]: new Collection<Account>(
    AccessLevels.Read.always,
    AccessLevels.Write.always
  ),
  [CollectionId.Sessions]: new Collection<Session>(
    AccessLevels.Read.always,
    AccessLevels.Write.always
  ),
  [CollectionId.Forms]: new Collection<unknown>(
    AccessLevels.Read.always,
    AccessLevels.Write.always
  ),
  [CollectionId.Pitreports]: new Collection<Pitreport>(
    AccessLevels.Read.ifOnOwnerTeamOrCompIsPublic,
    AccessLevels.Write.ifOnOwnerTeam
  ),
  [CollectionId.Picklists]: new Collection<DbPicklist>(
    AccessLevels.Read.ifOnOwnerTeamOrCompIsPublic,
    AccessLevels.Write.ifOnOwnerTeam
  ),
  [CollectionId.SubjectiveReports]: new Collection<SubjectiveReport>(
    AccessLevels.Read.ifOnOwnerTeamOrCompIsPublic,
    AccessLevels.Write.ifOnOwnerTeam
  ),
  [CollectionId.SlackInstallations]: new Collection<unknown>(
    AccessLevels.Read.never,
    AccessLevels.Write.never
  ),
}