import { NextApiResponse } from "next";
import ApiLib from "./api/ApiLib";
import InMemoryDbInterface from "./client/dbinterfaces/InMemoryDbInterface";
import ApiDependencies from "./api/ApiDependencies";
import DbInterface from "./client/dbinterfaces/DbInterface";
import { User } from "./Types";
import { ResendInterface } from "./ResendUtils";
import { User as NextAuthUser } from 'next-auth';

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
  async createContact() {
    return;
  }
  
  async emailDevelopers() {
    return;
  }
}

export function getTestApiUtils() {
  const db = new InMemoryDbInterface();
  db.init();

  return {
    res: new TestRes(),
    db,
    resend: new TestResend()
  }
}

export function getTestApiParams<TArgs extends Array<any>>(
  res: TestRes, deps: Partial<ApiDependencies> | Partial<{ db: DbInterface, userPromise: Partial<User>, resend: ResendInterface }>, args: TArgs
): [any, TestRes, ApiDependencies, undefined, any] {
  return [
    {} as any,
    res,
    {
      db: Promise.resolve(deps.db ?? new InMemoryDbInterface()),
      slackClient: undefined,
      userPromise: Promise.resolve(deps.userPromise ?? undefined),
      tba: undefined,
      resend: deps.resend ?? new TestResend(),
      ...deps
    } as ApiDependencies,
    undefined,
    args
  ]
}