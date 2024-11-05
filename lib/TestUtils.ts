import { NextApiResponse } from "next";
import ApiLib from "./api/ApiLib";
import InMemoryDbInterface from "./client/dbinterfaces/InMemoryDbInterface";
import ApiDependencies from "./api/ApiDependencies";
import DbInterface from "./client/dbinterfaces/DbInterface";
import { User } from "./Types";
import { ResendInterface } from "./ResendUtils";
import { ObjectId } from "bson";
import CollectionId from "./client/CollectionId";

export class TestRes extends ApiLib.ApiResponse<any> {
  status = jest.fn((code) => this);
  send = jest.fn((obj) => this);
  error = jest.fn((code, message) => {
    this.status(code);
    this.send({ error: message });
    return this;
  });

  constructor(res?: NextApiResponse) {
    super(res ?? {} as NextApiResponse);
  }
}

export class TestResend implements ResendInterface {
  createContact = jest.fn();
  emailDevelopers = jest.fn();
}

function getTestUser() {
  return {
    _id: new ObjectId(),
    email: "",
    name: "",
    image: "",
    teams: [],
    owner: []
  } as any as User;
}

export async function getTestApiUtils() {
  const db = new InMemoryDbInterface();
  db.init();

  const user = getTestUser();
  await db.addObject(CollectionId.Users, user);

  return {
    res: new TestRes(),
    db,
    resend: new TestResend(),
    user
  }
}

export async function getTestApiParams<TArgs extends Array<any>>(
  res: TestRes, deps: Partial<ApiDependencies> | Partial<{ db: DbInterface, user: Partial<User>, resend: ResendInterface }>, args: TArgs
): Promise<[any, TestRes, ApiDependencies, undefined, any]> {
  let user = (deps as any).user ?? (deps as any).userPromise;
  const db = await deps.db ?? new InMemoryDbInterface();

  if (!user) {
    user = getTestUser();
    (deps as any).user = user;

    await db.addObject(CollectionId.Users, user);
  }

  return [
    {} as any,
    res,
    {
      db: Promise.resolve(db),
      slackClient: undefined,
      userPromise: Promise.resolve(user),
      tba: undefined,
      resend: deps.resend ?? new TestResend(),
      ...deps
    } as ApiDependencies,
    undefined,
    args
  ]
}