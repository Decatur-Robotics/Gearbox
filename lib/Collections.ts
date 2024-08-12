import CollectionId from "./client/CollectionId"

class Collection {
}

export const Collections: { [id in CollectionId]: Collection } = {
  [CollectionId.Seasons]: {},
  [CollectionId.Competitions]: {},
  [CollectionId.Matches]: {},
  [CollectionId.Reports]: {},
  [CollectionId.Teams]: {},
  [CollectionId.Users]: {},
  [CollectionId.Accounts]: {},
  [CollectionId.Sessions]: {},
  [CollectionId.Forms]: {},
  [CollectionId.Pitreports]: {},
  [CollectionId.Picklists]: {},
  [CollectionId.SubjectiveReports]: {},
  [CollectionId.SlackInstallations]: {},
}