import ClientApi from "@/lib/api/ClientApi";
import CollectionId from "@/lib/client/CollectionId";
import { getTestApiParams, getTestApiUtils } from "@/lib/TestUtils";
import { League, Team, User } from "@/lib/Types";
import { ObjectId } from "bson";

const api = new ClientApi();

test(`${ClientApi.name}.${api.requestToJoinTeam.name}: Does nothing if user is already on team`, async () => {
  const { db, res } = getTestApiUtils();

  const teamId = new ObjectId();

  await db.addObject(CollectionId.Teams, {
    _id: teamId,
    users: ["1"],
    requests: []
  });

  await api.requestToJoinTeam.handler(...getTestApiParams(res, { db, userPromise: { _id: "1" } }, [teamId.toString()]));

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.send).toHaveBeenCalledWith({ result: "Already on team" });

  const team = await db.findObjectById<Team>(CollectionId.Teams, teamId);
  expect(team?.requests).toEqual([]);
});

test(`${ClientApi.name}.${api.requestToJoinTeam.name}: Adds user to team requests`, async () => {
  const { db, res } = getTestApiUtils();

  const teamId = new ObjectId();

  await db.addObject(CollectionId.Teams, {
    _id: teamId,
    users: ["1"],
    requests: []
  });

  await api.requestToJoinTeam.handler(...getTestApiParams(res, { db, userPromise: { _id: "2" } }, [teamId.toString()]));

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.send).toHaveBeenCalledWith({ result: "Success" });

  const team = await db.findObjectById<Team>(CollectionId.Teams, teamId);
  expect(team?.requests).toEqual(["2"]);
});

test(`${ClientApi.name}.${api.requestToJoinTeam.name}: Returns 404 if team not found`, async () => {
  const { db, res } = getTestApiUtils();

  const teamId = new ObjectId();

  await api.requestToJoinTeam.handler(...getTestApiParams(res, { db, userPromise: { _id: "2" } }, [teamId.toString()]));

  expect(res.error).toHaveBeenCalledWith(404, "Team not found");
});

test(`${ClientApi.name}.${api.createTeam.name}: Returns 400 if team already exists`, async () => {
  const { db, res } = getTestApiUtils();

  const userPromise: User = {
    _id: new ObjectId(),
    teams: [],
    owner: []
  } as any;

  const promises = [
    db.addObject(CollectionId.Teams, {
      number: 1,
      league: League.FRC
    }),
    db.addObject(CollectionId.Teams, {
      number: 2,
      league: League.FTC
    }),
    db.addObject(CollectionId.Users, userPromise)
  ];
  await Promise.all(promises);

  await api.createTeam.handler(...getTestApiParams(res, { db, userPromise }, ["", "", 1, League.FRC]));
  expect(res.status).toHaveBeenCalledWith(400);

  await api.createTeam.handler(...getTestApiParams(res, { db, userPromise }, ["", "", 2, League.FTC]));
  expect(res.status).toHaveBeenCalledWith(400);

  await api.createTeam.handler(...getTestApiParams(res, { db, userPromise }, ["", "", 2, League.FRC]));
  expect(res.status).toHaveBeenCalledWith(200);
});