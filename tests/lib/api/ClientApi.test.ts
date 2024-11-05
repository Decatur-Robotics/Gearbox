import ClientApi from "@/lib/api/ClientApi";
import CollectionId from "@/lib/client/CollectionId";
import { getTestApiParams, getTestApiUtils } from "@/lib/TestUtils";
import { League, Team, User } from "@/lib/Types";
import { ObjectId } from "bson";

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