import CollectionId from "./client/CollectionId"

type AccessParams = Partial<{

}>;

// class Collection<TAccessParams> {
//   private canAccessInternal: (accessParams: TAccessParams) => boolean;

//   constructor(access: (accessParams: TAccessParams) => boolean) {
//     this.canAccessInternal = access;
//   }

//   canAccess(accessParams: Partial<TAccessParams>): boolean {
//     const populatedAccessParams = accessParams;

//     return this.canAccessInternal(accessParams);
//   }
// }

// export const Collections: { [id in CollectionId]: Collection<AccessParams> } = {
//   [CollectionId.Seasons]: {},
//   [CollectionId.Competitions]: {},
//   [CollectionId.Matches]: {},
//   [CollectionId.Reports]: {},
//   [CollectionId.Teams]: {},
//   [CollectionId.Users]: {},
//   [CollectionId.Accounts]: {},
//   [CollectionId.Sessions]: {},
//   [CollectionId.Forms]: {},
//   [CollectionId.Pitreports]: {},
//   [CollectionId.Picklists]: {},
//   [CollectionId.SubjectiveReports]: {},
//   [CollectionId.SlackInstallations]: {},
// }