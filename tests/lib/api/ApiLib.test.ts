import ApiLib from "@/lib/api/ApiLib";
import { TestRes } from "@/lib/testutils/TestUtils";

const API_PREFIX = "api/";

type TestDependencies = {
	testDependency: string;
};

class TestApi extends ApiLib.ApiTemplate<TestDependencies> {
	segment = {
		routeWithPresetCaller: ApiLib.createRoute(
			{
				isAuthorized: (req, res, deps, [name, number]) =>
					Promise.resolve({ authorized: true, authData: {} }),
				handler: (req, res, deps, authData, [name, number]) => {
					res.status(200).send(`Hello, ${name} ${number}!`);
				},
			},
			(name: string, number: number) => {
				return Promise.resolve(`Hello, ${name} ${number}!`);
			},
		),

		routeWithoutPresetCaller: ApiLib.createRoute({
			isAuthorized: (req, res, deps, [name, number]) =>
				Promise.resolve({ authorized: true, authData: {} }),
			handler: (req, res, deps, authData, [name, number]) => {
				res.status(200).send(`Hello, ${name} ${number}!`);
			},
		}),
	};

	rootRoute = ApiLib.createRoute({
		isAuthorized: (req, res, deps, [name, number]) =>
			Promise.resolve({ authorized: true, authData: {} }),
		handler: (req, res, deps, authData, [name, number]) => {
			res.status(200).send(`Hello, ${name} ${number}!`);
		},
	});

	unauthorizedRoute = ApiLib.createRoute({
		isAuthorized: (req, res, deps, args) =>
			Promise.resolve({ authorized: false, authData: undefined }),
		handler(req, res, deps, authData, args) {
			res.status(200).send("Should not be happening!");
		},
	});

	routeWithAuthData = ApiLib.createRoute({
		isAuthorized: (req, res, deps, args) =>
			Promise.resolve({ authorized: true, authData: { x: 0 } }),
		handler(req, res, deps, authData, args) {
			res.status(200).send(authData.x);
		},
	});

	constructor() {
		super(false);
		this.init();
	}
}

class TestServerApi extends ApiLib.ServerApi<TestDependencies> {
	constructor() {
		super(new TestApi(), API_PREFIX, ApiLib.ErrorLogMode.None);
	}

	getDependencies() {
		return {
			testDependency: "test",
		};
	}
}

const clientApi = new TestApi();

test(`ApiLib.${ApiLib.createRoute.name}: Creates callable route`, async () => {
	const res = await clientApi.segment.routeWithPresetCaller("world", 42);
	expect(res).toBe("Hello, world 42!");
});

test(`ApiLib.${ApiLib.ApiTemplate.name}.init: Sets subUrl`, () => {
	expect(clientApi.segment.routeWithPresetCaller.subUrl).toBe(
		"/segment/routeWithPresetCaller",
	);
});

test(`ApiLib.${ApiLib.ApiTemplate.prototype.name}.init: Sets caller`, async () => {
	expect(clientApi.segment.routeWithPresetCaller.call).toBeDefined();
});

test(`ApiLib.${ApiLib.createRoute.name}: Creates callable route without caller`, async () => {
	expect(typeof clientApi.segment.routeWithoutPresetCaller).toBe("function");
	expect(clientApi.segment.routeWithoutPresetCaller.subUrl).toBe(
		"/segment/routeWithoutPresetCaller",
	);
});

test(`ApiLib.${ApiLib.ServerApi.name}.${ApiLib.ServerApi.prototype.handle.name}: Finds correct method`, async () => {
	const req = {
		url: API_PREFIX + "segment/routeWithoutPresetCaller",
		body: ["world", 42],
	};
	const res = new TestRes();

	await new TestServerApi().handle(req as any, res as any);

	expect(res.send).toHaveBeenCalledWith("Hello, world 42!");
	expect(res.status).toHaveBeenCalledWith(200);
});

test(`ApiLib.${ApiLib.ServerApi.name}.${ApiLib.ServerApi.prototype.handle.name}: Finds methods that are not in segments`, async () => {
	const req = {
		url: API_PREFIX + "rootRoute",
		body: ["world", 42],
	};
	const res = new TestRes();

	await new TestServerApi().handle(req as any, res as any);

	expect(res.send).toHaveBeenCalledWith("Hello, world 42!");
	expect(res.status).toHaveBeenCalledWith(200);
});

test(`ApiLib.${ApiLib.ServerApi.name}.${ApiLib.ServerApi.prototype.handle.name}: Throws 403 if unauthorized`, async () => {
	const req = {
		url: API_PREFIX + "unauthorizedRoute",
	};
	const res = new TestRes();

	await new TestServerApi().handle(req as any, res as any);

	expect(res.status).toHaveBeenCalledWith(403);
});

test(`ApiLib.${ApiLib.ServerApi.name}.${ApiLib.ServerApi.prototype.handle.name}: Passes authData to handler`, async () => {
	const req = {
		url: API_PREFIX + "routeWithAuthData",
	};
	const res = new TestRes();

	await new TestServerApi().handle(req as any, res as any);

	expect(res.send).toHaveBeenCalledWith(0);
});
