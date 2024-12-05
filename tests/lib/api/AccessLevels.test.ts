import AccessLevels from "@/lib/api/AccessLevels";
import CollectionId from "@/lib/client/CollectionId";
import DbInterface from "@/lib/client/dbinterfaces/DbInterface";
import { getTestApiUtils } from "@/lib/testutils/TestUtils";
import { Competition, Match, Season, SubjectiveReport, Team, User, Report, Pitreport, DbPicklist } from "@/lib/Types";
import { ObjectId } from "bson";

async function returnsFalseIfUserIsNotSignedIn(
  func: (req: any, res: any, deps: { userPromise: Promise<User>, db: Promise<DbInterface> }, id: string) => Promise<{ authorized: boolean }>
) {
  const { res } = await getTestApiUtils();
  expect((await func(undefined as any, res, { userPromise: Promise.resolve(null as any), db: undefined as any }, new ObjectId().toString())).authorized)
    .toBe(false);
}

async function returnsFalseIfDocumentDoesNotExist(
  func: (req: any, res: any, deps: { userPromise: Promise<User>, db: Promise<DbInterface> }, documentId: string) => Promise<{ authorized: boolean }>
) {
  const { res, user, db } = await getTestApiUtils();
  expect((await func(undefined as any, res, { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, new ObjectId().toString())).authorized)
    .toBe(false);
}

test(`AccessLevels.${AccessLevels.AlwaysAuthorized.name}: Returns true`, async () => {
  expect((await AccessLevels.AlwaysAuthorized()).authorized).toBe(true);
});

describe(`AccessLevels.${AccessLevels.IfSignedIn.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfSignedIn.name}: Returns true if user is signed in`, async () => {
    const { res, user } = await getTestApiUtils();
    expect((await AccessLevels.IfSignedIn(undefined as any, res, { userPromise: Promise.resolve(user), db: undefined as any })).authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfSignedIn.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfSignedIn));

  test(`AccessLevels.${AccessLevels.IfDeveloper.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfDeveloper));
});

describe(`AccessLevels.${AccessLevels.IfDeveloper.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfDeveloper.name}: Returns false if user is not a developer`, async () => {
    const { res, user } = await getTestApiUtils();
    expect((await AccessLevels.IfDeveloper(undefined as any, res, { userPromise: Promise.resolve(user), db: undefined as any })).authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfDeveloper.name}: Returns true if user is a developer`, async () => {
    const { res, user } = await getTestApiUtils();
    
    user.email = (JSON.parse(process.env.DEVELOPER_EMAILS) as string[])[0];

    expect((await AccessLevels.IfDeveloper(undefined as any, res, { userPromise: Promise.resolve(user), db: undefined as any })).authorized)
      .toBe(true);
  });
});

describe(`AccessLevels.${AccessLevels.IfOnTeam.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfOnTeam.name}: Returns false if user is not on the team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const team = await db.addObject(CollectionId.Teams, {
      users: []
    } as any as Team);

    expect((await AccessLevels.IfOnTeam(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        team._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeam.name}: Returns true if user is on the team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const team = await db.addObject(CollectionId.Teams, {
      users: [user._id?.toString()]
    } as any as Team);

    expect((await AccessLevels.IfOnTeam(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        team._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeam.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfOnTeam));

  test(`AccessLevels.${AccessLevels.IfOnTeam.name}: Returns false if team does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfOnTeam));
});

describe(`AccessLevels.${AccessLevels.IfTeamOwner.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfTeamOwner.name}: Returns false if user does not own team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const team = await db.addObject(CollectionId.Teams, {
      owners: []
    } as any as Team);

    expect((await AccessLevels.IfTeamOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        team._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfTeamOwner.name}: Returns true if user owns team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const team = await db.addObject(CollectionId.Teams, {
      owners: [user._id?.toString()]
    } as any as Team);

    expect((await AccessLevels.IfTeamOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        team._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfTeamOwner.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfTeamOwner));

  test(`AccessLevels.${AccessLevels.IfTeamOwner.name}: Returns false if team does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfTeamOwner));
});

describe(`AccessLevels.${AccessLevels.IfCompOwner.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfCompOwner}: Returns false if user does not own comp`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const comp = await db.addObject(CollectionId.Competitions, {} as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id?.toString()], owners: [] } as any as Team);

    expect((await AccessLevels.IfCompOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        comp._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfCompOwner}: Returns true if user owns comp`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const comp = await db.addObject(CollectionId.Competitions, {} as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], owners: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfCompOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        comp._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfCompOwner}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfCompOwner));

  test(`AccessLevels.${AccessLevels.IfCompOwner}: Returns false if comp does not exist`,
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfCompOwner));
});

describe(`AccessLevels.${AccessLevels.IfSeasonOwner.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfSeasonOwner}: Returns false if user does not own season`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const season = await db.addObject(CollectionId.Seasons, {} as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], owners: [] } as any as Team);

    expect((await AccessLevels.IfSeasonOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        season._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfSeasonOwner}: Returns true if user owns season`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const season = await db.addObject(CollectionId.Seasons, {} as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], owners: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfSeasonOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        season._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfSeasonOwner}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfSeasonOwner));

  test(`AccessLevels.${AccessLevels.IfSeasonOwner}: Returns false if season does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfSeasonOwner));
});

describe(`AccessLevels.${AccessLevels.IfMatchOwner.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfMatchOwner}: Returns false if user does not own match`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const match = await db.addObject(CollectionId.Matches, {} as any as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], owners: [] } as any as Team);

    expect((await AccessLevels.IfMatchOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        match._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfMatchOwner}: Returns true if user owns match`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const match = await db.addObject(CollectionId.Matches, {} as any as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], owners: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfMatchOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        match._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfMatchOwner}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfMatchOwner));

  test(`AccessLevels.${AccessLevels.IfMatchOwner}: Returns false if match does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfMatchOwner));
});

describe(`AccessLevels.${AccessLevels.IfReportOwner.name}`, () => {

  test(`AccessLevels.${AccessLevels.IfReportOwner.name}: Returns false if user does not own report`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const report = await db.addObject(CollectionId.Reports, {} as any as Report);
    const match = await db.addObject(CollectionId.Matches, { reports: [report._id!.toString()] } as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], owners: [] } as any as Team);

    expect((await AccessLevels.IfReportOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        report._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfReportOwner.name}: Returns true if user owns report`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const match = await db.addObject(CollectionId.Matches, {} as any as Match);
    const report = await db.addObject(CollectionId.Reports, { match: match._id!.toString() } as Report);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], owners: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfReportOwner(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        report._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfReportOwner.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfReportOwner));

  test(`AccessLevels.${AccessLevels.IfReportOwner.name}: Returns false if report does not exist`, 
  () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfReportOwner));
});

describe(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsComp.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsComp.name}: Returns false if user is not on team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const comp = await db.addObject(CollectionId.Competitions, {} as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsComp(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        comp._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsComp.name}: Returns true if user is on team that owns comp`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const comp = await db.addObject(CollectionId.Competitions, {} as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsComp(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        comp._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsComp.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfOnTeamThatOwnsComp));

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsComp.name}: Returns false if comp does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfOnTeamThatOwnsComp));
});

describe(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsMatch.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsMatch.name}: Returns false if user is not on team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const match = await db.addObject(CollectionId.Matches, {} as any as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsMatch(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        match._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsMatch.name}: Returns true if user is on team that owns match`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const match = await db.addObject(CollectionId.Matches, {} as any as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsMatch(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        match._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsMatch.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfOnTeamThatOwnsMatch));

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsMatch.name}: Returns false if match does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfOnTeamThatOwnsMatch));
});

describe(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPitReport.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPitReport.name}: Returns false if user is not on team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const pitReport = await db.addObject(CollectionId.PitReports, {} as any as Pitreport);
    const comp = await db.addObject(CollectionId.Competitions, { pitReports: [pitReport._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsPitReport(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        pitReport._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPitReport.name}: Returns true if user is on team that owns pit report`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const pitReport = await db.addObject(CollectionId.PitReports, {} as any as Pitreport);
    const comp = await db.addObject(CollectionId.Competitions, { pitReports: [pitReport._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsPitReport(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        pitReport._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPitReport.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfOnTeamThatOwnsPitReport));

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPitReport.name}: Returns false if pit report does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfOnTeamThatOwnsPitReport));
});

describe(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsReport.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsReport.name}: Returns false if user is not on team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const report = await db.addObject(CollectionId.Reports, {} as any as Report);
    const match = await db.addObject(CollectionId.Matches, { reports: [report._id!.toString()] } as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsReport(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        report._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsReport.name}: Returns true if user is on team that owns report`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const match = await db.addObject(CollectionId.Matches, {} as any as Match);
    const report = await db.addObject(CollectionId.Reports, { match: match._id!.toString() } as Report);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsReport(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        report._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsReport.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfOnTeamThatOwnsReport));

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsReport.name}: Returns false if report does not exist`,
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfOnTeamThatOwnsReport));
});

describe(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsSubjectiveReport.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsSubjectiveReport.name}: Returns false if user is not on team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const subjectiveReport = await db.addObject(CollectionId.SubjectiveReports, {} as any as SubjectiveReport);
    const match = await db.addObject(CollectionId.Matches, { subjectiveReports: [subjectiveReport._id!.toString()] } as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsSubjectiveReport(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        subjectiveReport._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsSubjectiveReport.name}: Returns true if user is on team that owns subjective report`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const subjectiveReport = await db.addObject(CollectionId.SubjectiveReports, {} as any as SubjectiveReport);
    const match = await db.addObject(CollectionId.Matches, { subjectiveReports: [subjectiveReport._id!.toString()] } as any as Match);
    const comp = await db.addObject(CollectionId.Competitions, { matches: [match._id!.toString()] } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsSubjectiveReport(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        subjectiveReport._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsSubjectiveReport.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfOnTeamThatOwnsSubjectiveReport));

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsSubjectiveReport.name}: Returns false if subjective report does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfOnTeamThatOwnsSubjectiveReport));
});

describe(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPicklist.name}`, () => {
  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPicklist.name}: Returns false if user is not on team`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const picklist = await db.addObject(CollectionId.Picklists, {} as any as DbPicklist);
    const comp = await db.addObject(CollectionId.Competitions, { picklist: picklist._id!.toString() } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsPicklist(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        picklist._id!.toString()))
      .authorized)
      .toBe(false);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPicklist.name}: Returns true if user is on team that owns picklist`, async () => {
    const { res, user, db } = await getTestApiUtils();

    const picklist = await db.addObject(CollectionId.Picklists, {} as any as DbPicklist);
    const comp = await db.addObject(CollectionId.Competitions, { picklist: picklist._id!.toString() } as any as Competition);
    const season = await db.addObject(CollectionId.Seasons, { competitions: [comp._id?.toString()] } as any as Season);
    await db.addObject(CollectionId.Teams, { seasons: [season._id!.toString()], users: [user._id!.toString()] } as any as Team);

    expect((await AccessLevels.IfOnTeamThatOwnsPicklist(
        undefined as any, 
        res, 
        { userPromise: Promise.resolve(user), db: Promise.resolve(db) }, 
        picklist._id!.toString()))
      .authorized)
      .toBe(true);
  });

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPicklist.name}: Returns false if user is not signed in`, 
    () => returnsFalseIfUserIsNotSignedIn(AccessLevels.IfOnTeamThatOwnsPicklist));

  test(`AccessLevels.${AccessLevels.IfOnTeamThatOwnsPicklist.name}: Returns false if picklist does not exist`, 
    () => returnsFalseIfDocumentDoesNotExist(AccessLevels.IfOnTeamThatOwnsPicklist));
});