import ClientApi from "@/lib/api/ClientApi";
import {
	getPicklistLength,
	insertAfterEntry,
	loadPicklistGroup,
	Picklist,
	PicklistEntry,
	removeEntryFromItsPicklist,
	savePicklistGroup,
	setHeadOfPicklist,
} from "@/lib/client/PicklistUtils";
import { CompPicklistGroup } from "@/lib/Types";
import { ObjectId } from "bson";

function createPicklist(index: number, entries: number[]) {
	const picklist: Picklist = {
		head: undefined,
		name: index.toString(),
		index,
		update: () => {},
		delete: () => {},
	};

	if (!entries.length) {
		return picklist;
	}

	picklist.head = {
		number: entries[0],
		id: new ObjectId().toString(),
		picklist,
	};
	let current = picklist.head;
	for (let i = 1; i < entries.length; i++) {
		current.next = {
			number: entries[i],
			id: new ObjectId().toString(),
			picklist,
		};
		current = current.next;
	}

	return picklist;
}

function toArray(picklist: Picklist) {
	const result: number[] = [];
	let current = picklist.head;
	while (current) {
		result.push(current.number);
		current = current.next;
	}
	return result;
}

function toIdArray(picklist: Picklist) {
	const result: string[] = [];
	let current = picklist.head;
	while (current) {
		result.push(current.id!);
		current = current.next;
	}
	return result;
}

function getAtIndex(picklist: Picklist, index: number) {
	let current = picklist.head;
	for (let i = 0; i < index; i++) {
		if (!current)
			throw new Error(
				`Index ${index} is out of bounds for picklist ${picklist.index}`,
			);
		current = current.next;
	}
	return current;
}

describe(getPicklistLength.name, () => {
	test("Returns the length of the picklist", () => {
		const picklist = createPicklist(0, [1, 2, 3]);
		expect(getPicklistLength(picklist)).toBe(3);
	});

	test("Returns 0 for an empty picklist", () => {
		const picklist = createPicklist(0, []);
		expect(getPicklistLength(picklist)).toBe(0);
	});
});

describe(removeEntryFromItsPicklist.name, () => {
	test("Removes the entry from the picklist when it is not the head", () => {
		const picklist = createPicklist(0, [1, 2, 3]);

		removeEntryFromItsPicklist(getAtIndex(picklist, 1)!);

		expect(getPicklistLength(picklist)).toBe(2);
		expect(toArray(picklist)).toEqual([1, 3]);
	});

	test("Removes the entry from the picklist when it is the head", () => {
		const picklist = createPicklist(0, [1, 2, 3]);

		removeEntryFromItsPicklist(getAtIndex(picklist, 0)!);

		expect(getPicklistLength(picklist)).toBe(2);
		expect(toArray(picklist)).toEqual([2, 3]);
	});

	test("Removes the entry from the picklist when it is the tail", () => {
		const picklist = createPicklist(0, [1, 2, 3]);

		removeEntryFromItsPicklist(getAtIndex(picklist, 2)!);

		expect(getPicklistLength(picklist)).toBe(2);
		expect(toArray(picklist)).toEqual([1, 2]);
	});

	test("Removes the entry from the picklist when it is the only entry", () => {
		const picklist = createPicklist(0, [1]);

		removeEntryFromItsPicklist(getAtIndex(picklist, 0)!);

		expect(getPicklistLength(picklist)).toBe(0);
		expect(picklist.head).toBeUndefined();
	});
});

describe(insertAfterEntry.name, () => {
	test("Does nothing when the entry is being moved to the same spot", () => {
		const picklist = createPicklist(0, [1, 2, 3]);
		const entry = getAtIndex(picklist, 1)!;

		insertAfterEntry(entry, entry);

		expect(getPicklistLength(picklist)).toBe(3);
		expect(toArray(picklist)).toEqual([1, 2, 3]);
	});

	test("Moves the entry to the correct spot", () => {
		const picklist = createPicklist(0, [1, 2, 3]);
		const entry = getAtIndex(picklist, 0)!;
		let dragged: PicklistEntry | undefined = getAtIndex(picklist, 2)!;

		dragged = insertAfterEntry(entry, dragged);

		expect(getPicklistLength(picklist)).toBe(3);
		expect(toArray(picklist)).toEqual([1, 3, 2]);
	});

	test("Removes the dragged entry from its picklist", () => {
		const newPicklist = createPicklist(0, [1, 2, 3]);
		const oldPicklist = createPicklist(1, [4, 5, 6]);

		const entry = getAtIndex(newPicklist, 0)!;
		let dragged: PicklistEntry | undefined = getAtIndex(oldPicklist, 2)!;

		dragged = insertAfterEntry(entry, dragged);

		expect(getPicklistLength(newPicklist)).toBe(4);
		expect(getPicklistLength(oldPicklist)).toBe(2);
		expect(toArray(newPicklist)).toEqual([1, 6, 2, 3]);
		expect(toArray(oldPicklist)).toEqual([4, 5]);
	});

	test("Sets the picklist of the dragged entry to the new picklist", () => {
		const newPicklist = createPicklist(0, [1, 2, 3]);
		const oldPicklist = createPicklist(1, [4, 5, 6]);

		const entry = getAtIndex(newPicklist, 0)!;
		let dragged: PicklistEntry | undefined = getAtIndex(oldPicklist, 2)!;

		dragged = insertAfterEntry(entry, dragged);

		expect(dragged?.picklist?.index).toBe(newPicklist.index);
	});

	test("Works when entry numbers are the same", () => {
		const newPicklist = createPicklist(0, [1, 1, 1]);
		const oldPicklist = createPicklist(1, [1, 1, 1]);

		const entry = getAtIndex(newPicklist, 0)!;
		let dragged: PicklistEntry | undefined = getAtIndex(oldPicklist, 2)!;

		dragged = insertAfterEntry(entry, dragged);

		expect(getPicklistLength(newPicklist)).toBe(4);
		expect(getPicklistLength(oldPicklist)).toBe(2);
		expect(toIdArray(newPicklist)).toEqual([
			newPicklist.head!.id!,
			dragged!.id!,
			newPicklist.head!.next!.next!.id!,
			newPicklist.head!.next!.next!.next!.id!,
		]);
		expect(toIdArray(oldPicklist)).toEqual([oldPicklist.head!.id!, oldPicklist.head!.next!.id!]);
	});
});

describe(setHeadOfPicklist.name, () => {
	test("Sets the head of the picklist", () => {
		const picklist = createPicklist(0, [1, 2, 3]);
		const newHead = getAtIndex(picklist, 2)!;

		setHeadOfPicklist(picklist, newHead);

		expect(picklist.head?.id).toBe(newHead.id);
	});

	test("Does nothing when the head is already the new head", () => {
		const picklist = createPicklist(0, [1, 2, 3]);
		const oldHead = picklist.head!;

		setHeadOfPicklist(picklist, oldHead);

		expect(picklist.head?.id).toBe(oldHead.id);
	});

	test("Removes the new head from its old picklist", () => {
		const newPicklist = createPicklist(0, [1, 2, 3]);
		const oldPicklist = createPicklist(1, [4, 5, 6]);

		let newHead: PicklistEntry | undefined = getAtIndex(oldPicklist, 2)!;

		newHead = setHeadOfPicklist(newPicklist, newHead);

		expect(getPicklistLength(newPicklist)).toBe(4);
		expect(getPicklistLength(oldPicklist)).toBe(2);
		expect(toArray(newPicklist)).toEqual([6, 1, 2, 3]);
		expect(toArray(oldPicklist)).toEqual([4, 5]);
	});

	test("Sets the picklist of the new head to the new picklist", () => {
		const newPicklist = createPicklist(0, [1, 2, 3]);
		const oldPicklist = createPicklist(1, [4, 5, 6]);

		let newHead: PicklistEntry | undefined = getAtIndex(oldPicklist, 2)!;

		newHead = setHeadOfPicklist(newPicklist, newHead);

		expect(newHead.picklist?.index).toBe(newPicklist.index);
	});
});

describe(savePicklistGroup.name, () => {
	test("Saves the picklist group", () => {
		const picklists = [
			createPicklist(0, [1, 2, 3]),
			createPicklist(1, [4, 5, 6]),
		];
		const group: CompPicklistGroup = {
			_id: new ObjectId().toString(),
			picklists: picklists.reduce(
				(acc, picklist) => {
					acc[picklist.name] = toArray(picklist);
					return acc;
				},
				{} as Record<string, number[]>,
			),
			strikethroughs: [1, 2],
		};
		const api = {
			updatePicklist: jest.fn(),
		} as any as ClientApi;

		savePicklistGroup(group._id, picklists, group.strikethroughs, api);

		expect(api.updatePicklist).toHaveBeenCalledWith(group);
	});

	test("Saves an empty picklist group", () => {
		const group: CompPicklistGroup = {
			_id: new ObjectId().toString(),
			picklists: {},
			strikethroughs: [],
		};
		const api = {
			updatePicklist: jest.fn(),
		} as any as ClientApi;

		savePicklistGroup(group._id, [], group.strikethroughs, api);

		expect(api.updatePicklist).toHaveBeenCalledWith(group);
	});

	test("Saves a picklist group with empty picklists", () => {
		const picklists = [createPicklist(0, []), createPicklist(1, [])];
		const group: CompPicklistGroup = {
			_id: new ObjectId().toString(),
			picklists: picklists.reduce(
				(acc, picklist) => {
					acc[picklist.name] = toArray(picklist);
					return acc;
				},
				{} as Record<string, number[]>,
			),
			strikethroughs: [],
		};
		const api = {
			updatePicklist: jest.fn(),
		} as any as ClientApi;

		savePicklistGroup(group._id, picklists, group.strikethroughs, api);

		expect(api.updatePicklist).toHaveBeenCalledWith(group);
	});
});

describe(loadPicklistGroup.name, () => {
	test("Loads the picklist group", () => {
		const group: CompPicklistGroup = {
			_id: new ObjectId().toString(),
			picklists: {
				"0": [1, 2, 3],
				"1": [4, 5, 6],
			},
			strikethroughs: [1, 2],
		};

		const setStrikethroughs = jest.fn();
		const setPicklists = jest.fn();
		const updatePicklist = jest.fn();
		const deletePicklist = jest.fn();

		loadPicklistGroup(
			group,
			setStrikethroughs,
			setPicklists,
			updatePicklist,
			deletePicklist,
		);

		expect(setStrikethroughs).toHaveBeenCalledWith(group.strikethroughs);

		const newPicklists = setPicklists.mock.calls[0][0].map(
			(picklist: Picklist) => {
				const entries = toArray(picklist);
				return {
					index: picklist.index,
					name: picklist.name,
					entries,
					update: picklist.update,
					delete: picklist.delete,
				};
			},
		);

		expect(JSON.stringify(newPicklists)).toBe(
			JSON.stringify([
				{
					index: 0,
					name: "0",
					entries: [1, 2, 3],
					update: updatePicklist,
					delete: () => deletePicklist(newPicklists[0]),
				},
				{
					index: 1,
					name: "1",
					entries: [4, 5, 6],
					update: updatePicklist,
					delete: () => deletePicklist(newPicklists[1]),
				},
			]),
		);
	});
});
