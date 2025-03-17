import {
	findObjectByIdFallback,
	saveObjectAfterResponse,
} from "@/lib/api/ClientApiUtils";
import CollectionId from "@/lib/client/CollectionId";
import { getTestApiUtils } from "@/lib/testutils/TestUtils";
import { Report } from "@/lib/Types";
import { ObjectId } from "bson";

describe(saveObjectAfterResponse.name, () => {
	test("Adds object to the database when ranFallback is false, only a single object is passed, and the object does not already exist", async () => {
		const { db } = await getTestApiUtils();

		const obj = {
			_id: new ObjectId(),
		} as any as Report;

		await saveObjectAfterResponse(
			{
				dbPromise: Promise.resolve(db),
			},
			CollectionId.Reports,
			obj,
			false,
		);

		const foundObj = await db.findObjectById(
			CollectionId.Reports,
			obj._id as any as ObjectId,
		);

		expect(foundObj).toEqual(obj);
		expect(await db.countObjects(CollectionId.Reports, {})).toEqual(1);
	});

	test("Updates object in the database when ranFallback is false, only a single object is passed, and the object already exists", async () => {
		const { db } = await getTestApiUtils();

		const obj = {
			_id: new ObjectId(),
		} as any as Report;

		await db.addObject(CollectionId.Reports, obj);

		const updatedObj = {
			...obj,
			someField: "updatedValue",
		} as any as Report;

		await saveObjectAfterResponse(
			{
				dbPromise: Promise.resolve(db),
			},
			CollectionId.Reports,
			updatedObj,
			false,
		);

		const foundObj = await db.findObjectById(
			CollectionId.Reports,
			updatedObj._id as any as ObjectId,
		);

		expect(foundObj).toEqual(updatedObj);
	});

	test("Does not add or update object in the database when ranFallback is true", async () => {
		const { db } = await getTestApiUtils();

		const obj = {
			_id: new ObjectId(),
		} as any as Report;

		await saveObjectAfterResponse(
			{
				dbPromise: Promise.resolve(db),
			},
			CollectionId.Reports,
			obj,
			true,
		);

		expect(await db.countObjects(CollectionId.Reports, {})).toEqual(0);
	});

	test("Adds multiple objects to the database when ranFallback is false, and an array of objects is passed", async () => {
		const { db } = await getTestApiUtils();

		const obj1 = {
			_id: new ObjectId(),
		} as any as Report;

		const obj2 = {
			_id: new ObjectId(),
		} as any as Report;

		await saveObjectAfterResponse(
			{
				dbPromise: Promise.resolve(db),
			},
			CollectionId.Reports,
			[obj1, obj2],
			false,
		);

		const foundObj1 = await db.findObjectById(
			CollectionId.Reports,
			obj1._id as any as ObjectId,
		);

		const foundObj2 = await db.findObjectById(
			CollectionId.Reports,
			obj2._id as any as ObjectId,
		);

		expect(foundObj1).toEqual(obj1);
		expect(foundObj2).toEqual(obj2);
		expect(await db.countObjects(CollectionId.Reports, {})).toEqual(2);
	});

	test("Does not add or update objects in the database when ranFallback is true and an array of objects is passed", async () => {
		const { db } = await getTestApiUtils();

		const obj1 = {
			_id: new ObjectId(),
		} as any as Report;

		const obj2 = {
			_id: new ObjectId(),
		} as any as Report;

		await saveObjectAfterResponse(
			{
				dbPromise: Promise.resolve(db),
			},
			CollectionId.Reports,
			[obj1, obj2],
			true,
		);

		expect(await db.countObjects(CollectionId.Reports, {})).toEqual(0);
	});

	test("Updates multiple objects in the database when ranFallback is false, and an array of objects is passed", async () => {
		const { db } = await getTestApiUtils();

		const obj1 = {
			_id: new ObjectId(),
		} as any as Report;

		const obj2 = {
			_id: new ObjectId(),
		} as any as Report;

		await db.addObject(CollectionId.Reports, obj1);
		await db.addObject(CollectionId.Reports, obj2);

		const updatedObj1 = {
			...obj1,
			someField: "updatedValue1",
		} as any as Report;

		const updatedObj2 = {
			...obj2,
			someField: "updatedValue2",
		} as any as Report;

		await saveObjectAfterResponse(
			{
				dbPromise: Promise.resolve(db),
			},
			CollectionId.Reports,
			[updatedObj1, updatedObj2],
			false,
		);

		const foundObj1 = await db.findObjectById(
			CollectionId.Reports,
			updatedObj1._id as any as ObjectId,
		);

		const foundObj2 = await db.findObjectById(
			CollectionId.Reports,
			updatedObj2._id as any as ObjectId,
		);

		expect(foundObj1).toEqual(updatedObj1);
		expect(foundObj2).toEqual(updatedObj2);
		expect(await db.countObjects(CollectionId.Reports, {})).toEqual(2);
	});

	test("Updates existing objects and adds new ones when ranFallback is false, and a mix of existing and new objects is passed", async () => {
		const { db } = await getTestApiUtils();

		const obj1 = {
			_id: new ObjectId(),
		} as any as Report;

		const obj2 = {
			_id: new ObjectId(),
		} as any as Report;

		await db.addObject(CollectionId.Reports, obj1);

		const updatedObj1 = {
			...obj1,
			someField: "updatedValue1",
		} as any as Report;

		await saveObjectAfterResponse(
			{
				dbPromise: Promise.resolve(db),
			},
			CollectionId.Reports,
			[updatedObj1, obj2],
			false,
		);

		const foundObj1 = await db.findObjectById(
			CollectionId.Reports,
			updatedObj1._id as any as ObjectId,
		);

		const foundObj2 = await db.findObjectById(
			CollectionId.Reports,
			obj2._id as any as ObjectId,
		);

		expect(foundObj1).toEqual(updatedObj1);
		expect(foundObj2).toEqual(obj2);
		expect(await db.countObjects(CollectionId.Reports, {})).toEqual(2);
	});
});

describe(findObjectByIdFallback.name, () => {
	test("Finds a single object by ID when passed a single ID", async () => {
		const { db } = await getTestApiUtils();

		const obj = {
			_id: new ObjectId(),
		} as any as Report;

		await db.addObject(CollectionId.Reports, obj);

		const foundObj = await findObjectByIdFallback(
			{ dbPromise: Promise.resolve(db) },
			CollectionId.Reports,
			obj._id!.toString(),
		);

		expect(foundObj).toEqual(obj);
	});

	test("Finds multiple objects by ID when passed an array of IDs", async () => {
		const { db } = await getTestApiUtils();

		const obj1 = {
			_id: new ObjectId(),
		} as any as Report;

		const obj2 = {
			_id: new ObjectId(),
		} as any as Report;

		await db.addObject(CollectionId.Reports, obj1);
		await db.addObject(CollectionId.Reports, obj2);

		const foundObjs = await findObjectByIdFallback(
			{ dbPromise: Promise.resolve(db) },
			CollectionId.Reports,
			[obj1._id!.toString(), obj2._id!.toString()],
		);

		expect(foundObjs).toEqual([obj1, obj2]);
	});

	test("Returns undefined when no object is found", async () => {
		const { db } = await getTestApiUtils();

		const foundObj = await findObjectByIdFallback(
			{ dbPromise: Promise.resolve(db) },
			CollectionId.Reports,
			new ObjectId().toString(),
		);

		expect(foundObj).toBeUndefined();
	});

	test("Returns only the existing objects when some IDs do not exist", async () => {
		const { db } = await getTestApiUtils();

		const obj1 = {
			_id: new ObjectId(),
		} as any as Report;

		await db.addObject(CollectionId.Reports, obj1);

		const foundObjs = await findObjectByIdFallback(
			{ dbPromise: Promise.resolve(db) },
			CollectionId.Reports,
			[obj1._id!.toString(), new ObjectId().toString()],
		);

		expect(foundObjs).toEqual([obj1]);
	});
});
