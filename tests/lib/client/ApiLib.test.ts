import { NextApiResponse } from 'next';
import ApiLib from '../../../lib/client/ApiLib';

type TestDependencies = {
  testDependency: string;
};

class TestApi extends ApiLib.ApiTemplate<TestDependencies> {
  segment = {
    routeWithPresetCaller: ApiLib.createRoute(
      {
        handler: (req, res, deps, [name, number]) => {
          res.status(200).send(`Hello, ${name} ${number}!`);
        },
      },
      (name: string, number: number) => {
        return Promise.resolve(`Hello, ${name} ${number}!`);
      }
    ),

    routeWithoutPresetCaller: ApiLib.createRoute(
      {
        handler: (req, res, deps, [name, number]) => {
          console.log("Called routeWithoutPresetCaller", name, number);
          return `Hello, ${name} ${number}!`;
        },
      }
    )
  };

  constructor() {
    super(false);
    this.init();
  }
}

class TestServerApi extends ApiLib.ServerApi<TestDependencies> {
  constructor() {
    super(new TestApi());
  }

  getDependencies() {
    return {
      testDependency: "test"
    };
  }
}

const clientApi = new TestApi();

test(`ApiLib.${ApiLib.createRoute.name}: Creates callable route`, async () => {
  const res = await clientApi.segment.routeWithPresetCaller("world", 42);
  expect(res).toBe("Hello, world 42!");
});

test(`ApiLib.${ApiLib.ApiTemplate.prototype.name}: Sets subUrl`, () => {
  expect(clientApi.segment.routeWithPresetCaller.subUrl).toBe("/segment/routeWithPresetCaller");
});

test(`ApiLib.${ApiLib.ApiTemplate.prototype.name}: Sets caller`, async () => {
  expect(clientApi.segment.routeWithPresetCaller.call).toBeDefined();
});

test(`ApiLib.${ApiLib.createRoute.name}: Creates callable route without caller`, async () => {
  expect(typeof clientApi.segment.routeWithoutPresetCaller).toBe("function");
  expect(clientApi.segment.routeWithoutPresetCaller.subUrl).toBe("/segment/routeWithoutPresetCaller");
});

test(`ApiLib.${ApiLib.ServerApi.name}: Finds correct method`, async () => {
  const serverApi = new TestServerApi();
  const req = {
    url: process.env.NEXT_PUBLIC_API_URL + "/segment/routeWithPresetCaller",
    body: JSON.stringify(["world", 42])
  };
  const res: NextApiResponse = {
    json: jest.fn(() => res),
    status: jest.fn(() => res),
    send: jest.fn(() => res)
  } as any;
  await serverApi.handle(req as any, res as any);
  
  expect(res.json).toHaveBeenCalledWith("Hello, world 42!");
  expect(res.status).toHaveBeenCalledWith(200);
});