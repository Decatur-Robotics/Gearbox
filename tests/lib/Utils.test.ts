import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import { createRedirect, GenerateSlug, isDeveloper, mentionUserInSlack } from "@/lib/Utils";

describe(GenerateSlug.name, () => {
  test("Removes whitespace and makes the name lowercase when DB is empty", async () => {
    const db = new InMemoryDbInterface();

    const collection = CollectionId.Misc;
    
    expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname");
  });

  test("Does not append an index to the name when DB has document with other slug", async () => {
    const db = new InMemoryDbInterface();

    const collection = CollectionId.Misc;
    await db.addObject(collection, { slug: "othername" });

    expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname");
  });

  test("Appends an index to the name when DB has a matching slug", async () => {
    const db = new InMemoryDbInterface();

    const collection = CollectionId.Misc;
    await db.addObject(collection, { slug: "testname" });

    expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname1");
  });

  test("Increments index to the name when DB has a matching slug with an index", async () => {
    const db = new InMemoryDbInterface();

    const collection = CollectionId.Misc;
    await Promise.all([
      db.addObject(collection, { slug: "testname" }),
      db.addObject(collection, { slug: "testname1" })
    ]);

    expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname2");
  });
});

describe(createRedirect.name, () => {
  test("Returns a redirect object with the destination and query", () => {
    const destination = "https://example.com";
    const query = { test: "test" };
    expect(createRedirect(destination, query)).toEqual({
      redirect: {
        destination: `${destination}?test=test`,
        permanent: false,
      },
    });
  });

  test("Returns a redirect object without a ? if no query is present", () => {
    const destination = "https://example.com";
    expect(createRedirect(destination)).toEqual({
      redirect: {
        destination: destination,
        permanent: false,
      },
    });
  });

  test("Returns a redirect object with a query string if query is empty", () => {
    const destination = "https://example.com";
    const query = {};
    expect(createRedirect(destination, query)).toEqual({
      redirect: {
        destination: destination,
        permanent: false,
      },
    });
  });

  const charsToBeEncoded = {
		"&": "%26",
		"?": "%3F",
		"=": "%3D",
		"#": "%23",
		"/": "%2F",
		" ": "%20",
	};

  test("Encodes query values", () => {
    const destination = "https://example.com";

    for (const [char, encoded] of Object.entries(charsToBeEncoded)) {
      const query = { test: char };
      expect(createRedirect(destination, query)).toEqual({
        redirect: {
          destination: `${destination}?test=${encoded}`,
          permanent: false,
        },
      });
    }
  });

  test("Encodes query keys", () => {
		const destination = "https://example.com";

		for (const [char, encoded] of Object.entries(charsToBeEncoded)) {
			const query = { [char]: "test" };
			expect(createRedirect(destination, query)).toEqual({
				redirect: {
					destination: `${destination}?${encoded}=test`,
					permanent: false,
				},
			});
		}
	});
});

describe(isDeveloper.name, () => {
	test("Returns true when email is a dev email", () => {
		expect(isDeveloper(JSON.parse(process.env.DEVELOPER_EMAILS)[0])).toBe(true);
	});

	test("Returns false when email is not a dev email", () => {
		expect(isDeveloper("notadev")).toBe(false);
	});

	test("Returns false when email is undefined", () => {
		expect(isDeveloper(undefined)).toBe(false);
	});
});

describe(mentionUserInSlack.name, () => {
  test("Returns a mention when user has a slackId", () => {
    const user = { slackId: "123", name: "Test User" };
    expect(mentionUserInSlack(user)).toBe("<@123>");
  });

  test("Returns the name when user does not have a slackId", () => {
    const user = { slackId: undefined, name: "Test User" };
    expect(mentionUserInSlack(user)).toBe("Test User");
  });

  test("Returns an empty string when user has no slackId or name", () => {
    const user = { slackId: undefined, name: undefined };
    expect(mentionUserInSlack(user)).toBe("");
  });
});
