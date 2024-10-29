import { NextApiResponse } from "next";
import ApiLib from "./api/ApiLib";
import InMemoryDbInterface from "./client/dbinterfaces/InMemoryDbInterface";
import ClientApi from "./api/ClientApi";
import ApiDependencies from "./api/ApiDependencies";
import DbInterface from "./client/dbinterfaces/DbInterface";
import { User } from "./Types";

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

export function getTestApiUtils() {
  const db = new InMemoryDbInterface();
  db.init();

  return {
    res: new TestRes(),
    db,
  }
}

export function getTestApiParams<TArgs extends Array<any>>(
  res: TestRes, deps: Partial<ApiDependencies> | Partial<{ db: DbInterface, userPromise: Partial<User> }>, args: TArgs
): [any, TestRes, ApiDependencies, undefined, any] {
  return [
    {} as any,
    res,
    {
      db: Promise.resolve(deps.db ?? new InMemoryDbInterface()),
      slackClient: undefined,
      userPromise: Promise.resolve(deps.userPromise ?? undefined),
      tba: undefined,
      ...deps
    } as ApiDependencies,
    undefined,
    args
  ]
}