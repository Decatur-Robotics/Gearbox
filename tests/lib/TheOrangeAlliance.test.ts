import { request, TheOrangeAlliance } from "@/lib/TheOrangeAlliance";
import { League, Team } from "@/lib/Types";
import { GenerateSlug } from "@/lib/Utils";
import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";

describe(request.name, () => {
	test("Fetches TOA_URL with suburl", async () => {
		const fetch = jest.fn(() =>
			Promise.resolve({ json: () => Promise.resolve({}) } as Response),
		);
		jest.spyOn(global, "fetch").mockImplementation(fetch);

		await request("/test");

		expect(fetch).toHaveBeenCalledWith(
			`${process.env.TOA_URL}/test`,
			expect.any(Object),
		);
	});

	test("Passes app ID and key in headers", async () => {
		const fetch = jest.fn(() =>
			Promise.resolve({ json: () => Promise.resolve({}) } as Response),
		);
		jest.spyOn(global, "fetch").mockImplementation(fetch);

		await request("/test");

		expect(
			(fetch.mock.calls[0] as unknown as [string, { headers: object }])[1]
				.headers,
		).toStrictEqual({
			"X-Application-Origin": process.env.TOA_APP_ID,
			"X-TOA-Key": process.env.TOA_KEY,
		});
	});

	test("Makes a GET request", async () => {
		const fetch = jest.fn(() =>
			Promise.resolve({ json: () => Promise.resolve({}) } as Response),
		);
		jest.spyOn(global, "fetch").mockImplementation(fetch);

		await request("/test");

		expect(
			(fetch.mock.calls[0] as unknown as [string, { method: string }])[1]
				.method,
		).toBe("GET");
	});
});

describe(`${TheOrangeAlliance.getTeam.name}`, () => {
	const db = new InMemoryDbInterface();

	test("Returns undefined if no teams are found", async () => {
		const request = jest.fn(() => Promise.resolve([]));

		const team = await TheOrangeAlliance.getTeam(12345, db, request);

		expect(team).toBeUndefined();
	});

	test("Returns undefined if team is missing number or short name", async () => {
		let request = jest.fn(() => Promise.resolve([{}]));
		let team = await TheOrangeAlliance.getTeam(12345, db, request);
		expect(team).toBeUndefined();

		request = jest.fn(() => Promise.resolve([{ team_number: 12345 }]));
		team = await TheOrangeAlliance.getTeam(12345, db, request);
		expect(team).toBeUndefined();

		request = jest.fn(() =>
			Promise.resolve([{ team_name_short: "Test Team" }]),
		);
		team = await TheOrangeAlliance.getTeam(12345, db, request);
		expect(team).toBeUndefined();

		request = jest.fn(() =>
			Promise.resolve([{ team_number: 12345, team_name_long: "Test Team" }]),
		);
		team = await TheOrangeAlliance.getTeam(12345, db, request);
		expect(team).toBeUndefined();
	});

	test("Returns a Team object", async () => {
		const request = jest.fn(() =>
			Promise.resolve([{ team_number: 12345, team_name_short: "Test Team" }]),
		);

		const team = await TheOrangeAlliance.getTeam(12345, db, request);

		expect(team).not.toBeUndefined();

		const expectedTeam = new Team(
			"Test Team",
			await GenerateSlug(db, CollectionId.Teams, "Test Team"),
			"",
			12345,
			League.FTC,
		);

		team!._id = expectedTeam._id;

		expect(team).toStrictEqual(expectedTeam);
	});
});
