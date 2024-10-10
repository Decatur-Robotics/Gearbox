import { ObjectId } from "bson"
import CollectionId from "./CollectionId"
import { Account, Competition, DbPicklist, Match, OwnedByComp, OwnedByTeam, Pitreport, Report, Season, Session, SubjectiveReport, Team, User } from "../Types"
import DbInterface from "./DbInterface"

class Collection<TDocument> {
  canRead: (userId: ObjectId | undefined, document: TDocument, db: DbInterface) => Promise<boolean>
  canWrite: (userId: ObjectId | undefined, document: TDocument, update: Partial<TDocument>, db: DbInterface) => Promise<boolean>

  constructor(
      canRead: (userId: ObjectId | undefined, document: TDocument, db: DbInterface) => Promise<boolean>, 
      canWrite: (userId: ObjectId | undefined, document: TDocument, update: Partial<TDocument>, db: DbInterface) => Promise<boolean>
    ) {
    this.canRead = canRead;
    this.canWrite = canWrite;
  }
}

namespace AccessLevels {
  export namespace Read {
    export async function ifOnOwnerTeam<TDocument extends OwnedByTeam | Team>(userId: ObjectId | undefined, document: TDocument, db: DbInterface) {
      if (!userId) return false;
     
      const team = "ownerTeam" in document
        ? db.findObjectById<Team>(CollectionId.Teams, new ObjectId(document.ownerTeam))
        : Promise.resolve(document as Team);

      if (!("ownerTeam" in document) && !("users" in document)) {
        // console.error("Used ifOnOwnerTeam access level for a document that doesn't have an ownerTeam or users field!");
        return true;
      }

      // Using both == and .equals is for backwards compatibility with IDs stored as strings
      return (await team)?.users?.some((id) => id == userId || (typeof id.equals === "function" && id.equals(userId))) ?? false;
    }

    export async function ifOnOwnerTeamOrCompIsPublic<TDocument extends OwnedByComp | Competition>(userId: ObjectId | undefined, document: TDocument, 
        db: DbInterface) {
      const comp = "ownerComp" in document 
        ? db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(document.ownerComp))
        : Promise.resolve(document as Competition);
      const canReadTeam = ifOnOwnerTeam(userId, document, db);

      return ((await comp)?.publicData ?? false) || await canReadTeam;
    }

    export async function never() {
      return false;
    }

    export async function always() {
      return true;
    }
  }

  export namespace Write {
    export async function ifOnOwnerTeam<TDocument extends OwnedByTeam>(userId: ObjectId | undefined, document: TDocument, update: Partial<TDocument>, 
        db: DbInterface) {
      return Read.ifOnOwnerTeam(userId, document, db);
    }
    
    export async function ifOnOwnerTeamOrCompIsPublic<TDocument extends OwnedByComp | Competition>(userId: ObjectId | undefined, document: TDocument, 
        update: Partial<TDocument>, db: DbInterface) {
      return Read.ifOnOwnerTeamOrCompIsPublic(userId, document, db);
    }

    export async function ifOnOwnerTeamOrQueryIsLimitedToKeys<TDocument extends OwnedByTeam | Team>(
        userId: ObjectId | undefined, document: TDocument, query: any, db: DbInterface, allowedKeys: (keyof TDocument)[]) {
      const isOnTeam = Read.ifOnOwnerTeam(userId, document, query);

      const keys = Object.keys(query);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        // If the key is a mongo update operator, add the keys it contains to the list of keys to check and remove the operator
        if (["$currentDate", "$inc", "$min", "$max", "$mul", "$rename", "$set", "$setOnInsert", "$unset"].includes(key)) {
          keys.splice(i, 1);
          keys.push(...Object.keys(query[key]));
          i--;
        }
      }

      return isOnTeam || keys.every(key => allowedKeys.includes(key as keyof TDocument));
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