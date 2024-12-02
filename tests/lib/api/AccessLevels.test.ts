import AccessLevels from "@/lib/api/AccessLevels";
import CollectionId from "@/lib/client/CollectionId";
import { getTestApiUtils } from "@/lib/TestUtils";
import { Team } from "@/lib/Types";

test(`${AccessLevels}.${AccessLevels.AlwaysAuthorized.name}: Returns true`, async () => {
  expect((await AccessLevels.AlwaysAuthorized()).authorized).toBe(true);
});

test(`${AccessLevels}.${AccessLevels.IfSignedIn.name}: Returns true if user is signed in`, async () => {
  const { res, user } = await getTestApiUtils();
  expect((await AccessLevels.IfSignedIn(undefined as any, res, { userPromise: Promise.resolve(user), db: undefined as any })).authorized)
    .toBe(true);
});

test(`${AccessLevels}.${AccessLevels.IfSignedIn.name}: Returns false if user is not signed in`, async () => {
  const { res } = await getTestApiUtils();
  expect((await AccessLevels.IfSignedIn(undefined as any, res, { userPromise: Promise.resolve(null as any), db: undefined as any })).authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfDeveloper.name}: Returns false if user is not signed in`, async () => {
  const { res } = await getTestApiUtils();
  expect((await AccessLevels.IfDeveloper(undefined as any, res, { userPromise: Promise.resolve(null as any), db: undefined as any })).authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfDeveloper.name}: Returns false if user is not a developer`, async () => {
  const { res, user } = await getTestApiUtils();
  expect((await AccessLevels.IfDeveloper(undefined as any, res, { userPromise: Promise.resolve(user), db: undefined as any })).authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfDeveloper.name}: Returns true if user is a developer`, async () => {
  const { res, user } = await getTestApiUtils();
  
  user.email = (JSON.parse(process.env.DEVELOPER_EMAILS) as string[])[0];

  expect((await AccessLevels.IfDeveloper(undefined as any, res, { userPromise: Promise.resolve(user), db: undefined as any })).authorized)
    .toBe(true);
});

test(`${AccessLevels}.${AccessLevels.IfOnTeam.name}: Returns false if user is not on the team`, async () => {
  const { res, user, db } = await getTestApiUtils();

  const team = await db.addObject<Team>(CollectionId.Teams, {
    users: []
  })

  expect((await AccessLevels.IfOnTeam(
      undefined as any, 
      res, 
      { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
      team._id.toString()))
    .authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfOnTeam.name}: Returns true if user is on the team`, async () => {
  const { res, user, db } = await getTestApiUtils();

  const team = await db.addObject<Team>(CollectionId.Teams, {
    users: [user._id?.toString()]
  })

  expect((await AccessLevels.IfOnTeam(
      undefined as any, 
      res, 
      { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
      team._id.toString()))
    .authorized)
    .toBe(true);
});

test(`${AccessLevels}.${AccessLevels.IfOnTeam.name}: Returns false if user is not signed in`, async () => {
  const { res } = await getTestApiUtils();
  expect((await AccessLevels.IfOnTeam(undefined as any, res, { userPromise: Promise.resolve(null as any), db: undefined as any }, "")).authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfOnTeam.name}: Returns false if team does not exist`, async () => {
  const { res, user, db } = await getTestApiUtils();
  expect((await AccessLevels.IfOnTeam(
      undefined as any, 
      res, 
      { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
      "non-existent"))
    .authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfTeamOwner.name}: Returns false if user does not own team`, async () => {
  const { res, user, db } = await getTestApiUtils();

  const team = await db.addObject<Team>(CollectionId.Teams, {
    owners: []
  })

  expect((await AccessLevels.IfTeamOwner(
      undefined as any, 
      res, 
      { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
      team._id.toString()))
    .authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfTeamOwner.name}: Returns true if user owns team`, async () => {
  const { res, user, db } = await getTestApiUtils();

  const team = await db.addObject<Team>(CollectionId.Teams, {
    owners: [user._id?.toString()]
  })

  expect((await AccessLevels.IfTeamOwner(
      undefined as any, 
      res, 
      { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
      team._id.toString()))
    .authorized)
    .toBe(true);
});

test(`${AccessLevels}.${AccessLevels.IfTeamOwner.name}: Returns false if user is not signed in`, async () => {
  const { res } = await getTestApiUtils();
  expect((await AccessLevels.IfTeamOwner(undefined as any, res, { userPromise: Promise.resolve(null as any), db: undefined as any }, "")).authorized)
    .toBe(false);
});

test(`${AccessLevels}.${AccessLevels.IfTeamOwner.name}: Returns false if team does not exist`, async () => {
  const { res, user, db } = await getTestApiUtils();
  expect((await AccessLevels.IfTeamOwner(
      undefined as any, 
      res, 
      { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
      "non-existent"))
    .authorized)
    .toBe(false);
});