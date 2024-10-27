import exp from 'constants';
import ApiLib from '../../../lib/client/ApiLib';
class TestClientApi extends ApiLib.ClientApiTemplate {
  segment = {
    routeWithPresetCaller: ApiLib.createRoute(
      {
        handler: (req, res, deps, [name, number]) => {
          return `Hello, ${name} ${number}!`;
        },
      },
      (name: string, number: number) => {
        return Promise.resolve(`Hello, ${name} ${number}!`);
      }
    ),

    routeWithoutPresetCaller: ApiLib.createRoute(
      {
        handler: (req, res, deps, [name, number]) => {
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

const clientApi = new TestClientApi();

test(`ApiLib.${ApiLib.createRoute.name}: Creates callable route`, async () => {
  const res = await clientApi.segment.routeWithPresetCaller("world", 42);
  expect(res).toBe("Hello, world 42!");
});

test(`ApiLib.${ApiLib.ClientApiTemplate.prototype.name}: Sets subUrl`, () => {
  expect(clientApi.segment.routeWithPresetCaller.subUrl).toBe("/segment/routeWithPresetCaller");
});

test(`ApiLib.${ApiLib.ClientApiTemplate.prototype.name}: Sets caller`, async () => {
  expect(clientApi.segment.routeWithPresetCaller.call).toBeDefined();
});

test(`ApiLib.${ApiLib.createRoute.name}: Creates callable route without caller`, async () => {
  expect(typeof clientApi.segment.routeWithoutPresetCaller).toBe("function");
  expect(clientApi.segment.routeWithoutPresetCaller.subUrl).toBe("/segment/routeWithoutPresetCaller");
});