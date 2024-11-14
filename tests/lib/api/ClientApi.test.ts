import ClientApi from "@/lib/api/ClientApi";
import CollectionId from "@/lib/client/CollectionId";
import { GameId } from "@/lib/client/GameId";
import { getTestApiParams, getTestApiUtils } from "@/lib/TestUtils";
import { AllianceColor, League, Match, MatchType, QuantData, Report, Season, Team, User } from "@/lib/Types";
import { EJSON, ObjectId } from "bson";

const api = new ClientApi();

describe(`${ClientApi.name}.${api.requestToJoinTeam.name}`, () => {
  test(`${ClientApi.name}.${api.requestToJoinTeam.name}: Does nothing if user is already on team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const teamId = new ObjectId();

    await db.addObject(CollectionId.Teams, {
      _id: teamId,
      users: [user._id!.toString()],
      requests: []
    });

    await api.requestToJoinTeam.handler(...await getTestApiParams(res, { db, user }, [teamId.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ result: "Already on team" });

    const team = await db.findObjectById<Team>(CollectionId.Teams, teamId);
    expect(team?.requests).toEqual([]);
  });

  test(`${ClientApi.name}.${api.requestToJoinTeam.name}: Adds user to team requests`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const teamId = new ObjectId();

    await db.addObject(CollectionId.Teams, {
      _id: teamId,
      users: [],
      requests: []
    });

    await api.requestToJoinTeam.handler(...await getTestApiParams(res, { db, user }, [teamId.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ result: "Success" });

    const team = await db.findObjectById<Team>(CollectionId.Teams, teamId);
    expect(team?.requests).toEqual([user._id!.toString()]);
  });

  test(`${ClientApi.name}.${api.requestToJoinTeam.name}: Returns 404 if team not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const teamId = new ObjectId();

    await api.requestToJoinTeam.handler(...await getTestApiParams(res, { db, user }, [teamId.toString()]));

    expect(res.error).toHaveBeenCalledWith(404, "Team not found");
  });
});

describe(`${ClientApi.name}.${api.handleTeamJoinRequest.name}`, () => {
  test(`${ClientApi.name}.${api.handleTeamJoinRequest.name}: Returns 404 if team not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const teamId = new ObjectId();
    const userId = new ObjectId();

    await api.handleTeamJoinRequest.handler(...await getTestApiParams(res, { db, user }, [true, teamId.toString(), userId.toString()]));

    expect(res.error).toHaveBeenCalledWith(404, "Team not found");
  });

  test(`${ClientApi.name}.${api.handleTeamJoinRequest.name}: Returns 403 if user does not own team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const teamId = new ObjectId();
    const userId = new ObjectId();

    await db.addObject(CollectionId.Teams, {
      _id: teamId,
      users: [],
      requests: [],
      owners: [],
      scouters: []
    });

    await api.handleTeamJoinRequest.handler(...await getTestApiParams(res, { db, user }, [true, teamId.toString(), userId.toString()]));

    expect(res.error).toHaveBeenCalledWith(403, "You do not own this team");
  });

  test(`${ClientApi.name}.${api.handleTeamJoinRequest.name}: Accepts user to team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const teamId = new ObjectId();
    const userId = new ObjectId();

    await db.addObject(CollectionId.Teams, {
      _id: teamId,
      users: [],
      requests: [],
      owners: [user._id!.toString()],
      scouters: []
    });

    await db.addObject(CollectionId.Users, {
      _id: userId,
      teams: []
    });

    await api.handleTeamJoinRequest.handler(...await getTestApiParams(res, { db, user }, [true, teamId.toString(), userId.toString()]));

    const team = await db.findObjectById<Team>(CollectionId.Teams, teamId);
    expect(team?.users).toEqual([userId.toString()]);

    const foundUser = await db.findObjectById<User>(CollectionId.Users, userId);
    expect(foundUser?.teams).toEqual([teamId.toString()]);
  });

  test(`${ClientApi.name}.${api.handleTeamJoinRequest.name}: Rejects user from team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const teamId = new ObjectId();

    await db.addObject(CollectionId.Teams, {
      _id: teamId,
      users: [],
      requests: [],
      owners: [user._id!.toString()],
      scouters: []
    });

    await api.handleTeamJoinRequest.handler(...await getTestApiParams(res, { db, user }, [false, teamId.toString(), new ObjectId().toString()]));

    const team = await db.findObjectById<Team>(CollectionId.Teams, teamId);
    expect(team?.requests).toEqual([]);
    expect(team?.users).toEqual([]);
  });
});

describe(`${ClientApi.name}.${api.createTeam.name}`, () => {
  test(`${ClientApi.name}.${api.createTeam.name}: Returns 400 if team already exists`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const promises = [
      db.addObject(CollectionId.Teams, {
        number: 1,
        league: League.FRC
      }),
      db.addObject(CollectionId.Teams, {
        number: 2,
        league: League.FTC
      }),
      db.addObject(CollectionId.Users, user)
    ];
    await Promise.all(promises);

    await api.createTeam.handler(...await getTestApiParams(res, { db, user }, ["", "", 1, League.FRC]));
    expect(res.status).toHaveBeenCalledWith(400);

    await api.createTeam.handler(...await getTestApiParams(res, { db, user }, ["", "", 2, League.FTC]));
    expect(res.status).toHaveBeenCalledWith(400);

    await api.createTeam.handler(...await getTestApiParams(res, { db, user }, ["", "", 2, League.FRC]));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test(`${ClientApi.name}.${api.createTeam.name}: Adds team to DB`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await db.addObject(CollectionId.Users, user);

    await api.createTeam.handler(...await getTestApiParams(res, { db, user }, ["", "", 1, League.FRC]));

    const team = await db.findObject<Team>(CollectionId.Teams, { number: 1, league: League.FRC });
    expect(team).toBeTruthy();
  });

  test(`${ClientApi.name}.${api.createTeam.name}: Adds team to user`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await db.addObject(CollectionId.Users, user);

    await api.createTeam.handler(...await getTestApiParams(res, { db, user }, ["", "", 1, League.FRC]));
    const team = res.send.mock.calls[0][0] as Team; // The handler doesn't return a value, so we have to get the team from res
    
    const foundUser = await db.findObjectById<User>(CollectionId.Users, new ObjectId(user._id!));
    expect(foundUser?.teams).toEqual(expect.arrayContaining([team._id!.toString()]));
    expect(foundUser?.owner).toEqual(expect.arrayContaining([team._id!.toString()]));
  });

  test(`${ClientApi.name}.${api.createTeam.name}: Notifies developers`, async () => {
    const { db, res, resend } = await getTestApiUtils();

    await api.createTeam.handler(...await getTestApiParams(res, { db, resend }, ["", "", 1, League.FRC]));
    
    expect(resend.emailDevelopers).toHaveBeenCalled();
  });
});

describe(`${ClientApi.name}.${api.findUserById.name}`, () => {
  test(`${ClientApi.name}.${api.findUserById.name}: Returns user if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await db.addObject(CollectionId.Users, user);

    await api.findUserById.handler(...await getTestApiParams(res, { db, user }, [user._id!.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(user);
  });

  test(`${ClientApi.name}.${api.findUserById.name}: Returns undefined if user not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findUserById.handler(...await getTestApiParams(res, { db, user }, [new ObjectId().toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.findTeamById.name}`, () => {
  test(`${ClientApi.name}.${api.findTeamById.name}: Returns team if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const team = await db.addObject(CollectionId.Teams, new Team("Test Team", "test-team", "tbaId", 1234, League.FRC));

    await api.findTeamById.handler(...await getTestApiParams(res, { db, user }, [team._id!.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(team);
  });

  test(`${ClientApi.name}.${api.findTeamById.name}: Returns undefined if team not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findTeamById.handler(...await getTestApiParams(res, { db, user }, [new ObjectId().toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.findTeamByNumberAndLeague.name}`, () => {
  test(`${ClientApi.name}.${api.findTeamByNumberAndLeague.name}: Returns team if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const team = new Team("Test Team", "test-team", "tbaId", 1234, League.FRC);

    await db.addObject(CollectionId.Teams, team);

    await api.findTeamByNumberAndLeague.handler(...await getTestApiParams(res, { db, user }, [team.number, team.league]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(team);
  });

  test(`${ClientApi.name}.${api.findTeamByNumberAndLeague.name}: Returns undefined if team not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findTeamByNumberAndLeague.handler(...await getTestApiParams(res, { db, user }, [1234, League.FRC]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.findSeasonById.name}`, () => {
  test(`${ClientApi.name}.${api.findSeasonById.name}: Returns season if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const season = new Season("Test Season", "test-season", 2022, GameId.IntoTheDeep, []);
    await db.addObject(CollectionId.Seasons, season);

    await api.findSeasonById.handler(...await getTestApiParams(res, { db, user }, [season._id!.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(season);
  });

  test(`${ClientApi.name}.${api.findSeasonById.name}: Returns undefined if season not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findSeasonById.handler(...await getTestApiParams(res, { db, user }, [new ObjectId().toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.findCompetitionById.name}`, () => {
  test(`${ClientApi.name}.${api.findCompetitionById.name}: Returns competition if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const competition = { _id: new ObjectId(), name: "Test Competition", slug: "test-competition", tbaId: "test-tbaId", start: 0, end: 0, pitReports: [], matches: [], picklist: "", publicData: false, gameId: "test-game" };
    await db.addObject(CollectionId.Competitions, competition);

    await api.findCompetitionById.handler(...await getTestApiParams(res, { db, user }, [competition._id!.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(competition);
  });

  test(`${ClientApi.name}.${api.findCompetitionById.name}: Returns undefined if competition not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findCompetitionById.handler(...await getTestApiParams(res, { db, user }, [new ObjectId().toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.findMatchById.name}`, () => {
  test(`${ClientApi.name}.${api.findMatchById.name}: Returns match if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const match = { _id: new ObjectId(), slug: "test-match", tbaId: "test-tbaId", type: "test-type", number: 1, blueAlliance: [], redAlliance: [], time: 0, reports: [], subjectiveScouter: "", subjectiveReports: [], subjectiveReportsCheckInTimestamps: {}, assignedSubjectiveScouterHasSubmitted: false };
    await db.addObject(CollectionId.Matches, match);

    await api.findMatchById.handler(...await getTestApiParams(res, { db, user }, [match._id!.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(match);
  });

  test(`${ClientApi.name}.${api.findMatchById.name}: Returns undefined if match not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findMatchById.handler(...await getTestApiParams(res, { db, user }, [new ObjectId().toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.findReportById.name}`, () => {
  test(`${ClientApi.name}.${api.findReportById.name}: Returns report if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const report = { _id: new ObjectId(), timestamp: 0, user: "test-user", submitter: "test-submitter", color: "test-color", robotNumber: 1, match: "test-match", submitted: false, data: {}, checkInTimestamp: "test-checkInTimestamp" };
    await db.addObject(CollectionId.Reports, report);

    await api.findReportById.handler(...await getTestApiParams(res, { db, user }, [report._id!.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(report);
  });

  test(`${ClientApi.name}.${api.findReportById.name}: Returns undefined if report not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findReportById.handler(...await getTestApiParams(res, { db, user }, [new ObjectId().toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.findPitreportById.name}`, () => {
  test(`${ClientApi.name}.${api.findPitreportById.name}: Returns pitreport if found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const pitreport = { _id: new ObjectId(), teamNumber: 1, submitted: false, submitter: "test-submitter", data: {} };
    await db.addObject(CollectionId.PitReports, pitreport);

    await api.findPitreportById.handler(...await getTestApiParams(res, { db, user }, [pitreport._id!.toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(pitreport);
  });

  test(`${ClientApi.name}.${api.findPitreportById.name}: Returns undefined if pitreport not found`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await api.findPitreportById.handler(...await getTestApiParams(res, { db, user }, [new ObjectId().toString()]));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(undefined);
  });
});

describe(`${ClientApi.name}.${api.updateUser.name}`, () => {
  test(`${ClientApi.name}.${api.updateUser.name}: Updates user`, async () => {
    const { db, res, user } = await getTestApiUtils();

    await db.addObject(CollectionId.Users, user);

    const newValues = { name: "Updated User" };
    await api.updateUser.handler(...await getTestApiParams(res, { db, user }, [newValues]));

    const updatedUser = await db.findObjectById<User>(CollectionId.Users, new ObjectId(user._id!));
    expect(updatedUser?.name).toEqual(newValues.name);
  });
});

describe(`${ClientApi.name}.${api.updateTeam.name}`, () => {
  test(`${ClientApi.name}.${api.updateTeam.name}: Updates team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const team = new Team("Test Team", "test-team", "tbaId", 1234, League.FRC, [user._id!.toString()]);
    await db.addObject(CollectionId.Teams, team);

    const newValues = { name: "Updated Team" };
    await api.updateTeam.handler(...await getTestApiParams(res, { db, user }, [newValues, team._id!.toString()], team));

    const updatedTeam = await db.findObjectById<Team>(CollectionId.Teams, new ObjectId(team._id!));
    expect(updatedTeam?.name).toEqual(newValues.name);
  });

  test(`${ClientApi.name}.${api.updateTeam.name}: Returns 403 if unauthorized`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const team = new Team("Test Team", "test-team", "tbaId", 1234, League.FRC);
    await db.addObject(CollectionId.Teams, team);

    const newValues = { name: "Updated Team" };
    const args = await getTestApiParams(res, { db, user }, [newValues, team._id!.toString()]);

    expect((await api.updateTeam.isAuthorized(args[0], args[1], args[2], args[4])).authorized).toBe(false);
  });
});

describe(`${ClientApi.name}.${api.updateSeason.name}`, () => {
  test(`${ClientApi.name}.${api.updateSeason.name}: Updates season`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const team = new Team("Test Team", "test-team", "tbaId", 1234, League.FRC, [user._id!.toString()]);
    await db.addObject(CollectionId.Teams, team);

    const season: Season = new Season("Test Season", "test-season", 2022, GameId.IntoTheDeep, []);
    await db.addObject(CollectionId.Seasons, season);

    const newValues = { name: "Updated Season" };
    await api.updateSeason.handler(...await getTestApiParams(res, { db, user }, [newValues, season._id!.toString()], { team, season }));

    const updatedSeason = await db.findObjectById(CollectionId.Seasons, new ObjectId(season._id!));
    expect(updatedSeason?.name).toEqual(newValues.name);
  });

  test(`${ClientApi.name}.${api.updateSeason.name}: Check if user owns team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const season = new Season("Test Season", "test-season", 2022, GameId.IntoTheDeep, []);
    await db.addObject(CollectionId.Seasons, season);

    const newValues = { name: "Updated Season" };
    const args = await getTestApiParams(res, { db, user }, [newValues, season._id!.toString()]);
    
    expect((await api.updateSeason.isAuthorized(args[0], args[1], args[2], args[4])).authorized).toBe(false);
  });
});

describe(`${ClientApi.name}.${api.updateReport.name}`, () => {
  test(`${ClientApi.name}.${api.updateReport.name}: Updates report`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const team = new Team("Test Team", "test-team", "tbaId", 1234, League.FRC, [user._id!.toString()]);
    await db.addObject(CollectionId.Teams, team);

    const match: Match = new Match(0, "test-match", "test-tbaId", 0, MatchType.Qualifying, [], [], []);
    await db.addObject(CollectionId.Matches, match);

    const report = new Report(new ObjectId().toString(), {} as QuantData, 0, AllianceColor.Blue, "", 1, "");
    await db.addObject(CollectionId.Reports, report);

    const newValues = { data: { updated: true } };
    await api.updateReport.handler(...await getTestApiParams(res, { db, user }, [newValues, report._id!.toString()], { team, report }));

    const updatedReport = await db.findObjectById(CollectionId.Reports, new ObjectId(report._id!));
    expect(updatedReport?.data).toEqual(newValues.data);
  });

  test(`${ClientApi.name}.${api.updateReport.name}: Check if user is on team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const report = { _id: new ObjectId(), timestamp: 0, user: "test-user", submitter: "test-submitter", color: "test-color", robotNumber: 1, match: "test-match", submitted: false, data: {}, checkInTimestamp: "test-checkInTimestamp" };
    await db.addObject(CollectionId.Reports, report);

    const newValues = { data: { updated: true } };
    const args = await getTestApiParams(res, { db, user }, [newValues, report._id!.toString()]);
    
    expect((await api.updateReport.isAuthorized(args[0], args[1], args[2], args[4])).authorized).toBe(false);
  });
});

describe(`${ClientApi.name}.${api.updatePitreport.name}`, () => {
  test(`${ClientApi.name}.${api.updatePitreport.name}: Updates pitreport`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const team = new Team("Test Team", "test-team", "tbaId", 1234, League.FRC, [user._id!.toString()]);
    await db.addObject(CollectionId.Teams, team);

    const competition = { _id: new ObjectId(), name: "Test Competition", slug: "test-competition", tbaId: "test-tbaId", start: 0, end: 0, pitReports: [], matches: [], picklist: "", publicData: false, gameId: "test-game" };
    await db.addObject(CollectionId.Competitions, competition);

    const pitreport = { _id: new ObjectId(), teamNumber: 1, submitted: false, submitter: "test-submitter", data: {} };
    await db.addObject(CollectionId.PitReports, pitreport);

    const newValues = { data: { updated: true } };
    await api.updatePitreport.handler(...await getTestApiParams(res, { db, user }, [pitreport._id!.toString(), newValues], { team: team as any, comp: competition as any }));

    const updatedPitreport = await db.findObjectById(CollectionId.PitReports, new ObjectId(pitreport._id!));
    expect(updatedPitreport?.data).toEqual(newValues.data);
  });

  test(`${ClientApi.name}.${api.updatePitreport.name}: Check if user is on team`, async () => {
    const { db, res, user } = await getTestApiUtils();

    const pitReport = { _id: new ObjectId(), teamNumber: 1, submitted: false, submitter: "test-submitter", data: {} };
    await db.addObject(CollectionId.PitReports, pitReport);

    const newValues = { data: { updated: true } };
    const args = await getTestApiParams(res, { db, user }, [pitReport._id!.toString(), newValues]);
    
    expect((await api.updatePitreport.isAuthorized(args[0], args[1], args[2], args[4])).authorized).toBe(false);
  });
});