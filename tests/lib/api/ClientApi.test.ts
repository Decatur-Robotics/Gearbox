import ClientApi from "@/lib/api/ClientApi";
import CollectionId from "@/lib/client/CollectionId";
import { getTestApiParams, getTestApiUtils } from "@/lib/TestUtils";
import { Team, User } from "@/lib/Types";
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