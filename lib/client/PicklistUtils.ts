// @tested_by tests/lib/client/Picklist.test.ts

import { ObjectId } from "bson";
import { CompPicklistGroup } from "../Types";
import ClientApi from "../api/ClientApi";

export type Picklist = {
	index: number;
	name: string;
	head: PicklistEntry | undefined;
	update: (picklist: Picklist) => void;
	delete: () => void;
};

export type PicklistEntry = {
	number: number;
	next?: PicklistEntry;
	picklist?: Picklist;
	id?: string;
};

export function getPicklistLength(picklist: Picklist) {
	let length = 0;
	let curr = picklist.head;
	while (curr) {
		length++;
		curr = curr.next;
	}

	return length;
}

export function removeEntryFromItsPicklist(entry: PicklistEntry) {
	if (entry.picklist) {
		const picklist = entry.picklist;
		if (picklist.head?.id && picklist.head?.id === entry.id) {
			picklist.head = picklist.head.next;
		} else {
			let curr: PicklistEntry | undefined = picklist.head;
			while (curr) {
				if (curr.next?.number === entry.number) {
					curr.next = curr.next.next;
					break;
				}

				curr = curr.next;
			}
		}

		entry.picklist = undefined;

		picklist.update(picklist);

		return picklist;
	}
}

export function insertAfterEntry(entry: PicklistEntry, dragged: PicklistEntry) {
	// If you're moving a card into the same spot, don't do anything
	if (
		entry.number === dragged.number &&
		entry.next === dragged.next &&
		entry.picklist === dragged.picklist
	)
		return;

	removeEntryFromItsPicklist(dragged);

	// Create a copy, don't operate on the original
	dragged = {
		id: dragged.id,
		number: dragged.number,
		next: entry.next,
		picklist: entry.picklist,
	};

	entry.next = dragged;

	entry.picklist?.update(entry.picklist);

	return dragged;
}

export function setHeadOfPicklist(picklist: Picklist, entry: PicklistEntry) {
	removeEntryFromItsPicklist(entry);

	const newEntry = {
		number: entry.number,
		next: picklist.head,
		picklist,
		id: entry.id,
	};
	picklist.head = newEntry;

	picklist.update(picklist);

	return newEntry;
}

export function setTailOfPicklist(picklist: Picklist, entry: PicklistEntry) {
	removeEntryFromItsPicklist(entry);
	entry = {
		...entry,
		picklist,
		next: undefined,
	};

	let tail = picklist.head;
	if (!tail) {
		picklist.head = entry;
	} else {
		while (tail.next) {
			tail = tail.next;
		}

		tail.next = entry;
	}

	picklist.update(picklist);
	return entry;
}

export function savePicklistGroup(
	id: string,
	picklists: Picklist[],
	strikethroughs: number[],
	api: ClientApi,
) {
	const picklistDict = picklists.reduce<CompPicklistGroup>(
		(acc, picklist) => {
			const picklistArray: number[] = [];
			for (let curr = picklist.head; curr; curr = curr.next) {
				picklistArray.push(curr.number);
			}

			acc.picklists[picklist.name] = picklistArray;
			return acc;
		},
		{
			_id: new ObjectId(id),
			picklists: {},
			strikethroughs,
		},
	);

	api.updatePicklist(picklistDict);
}

export function loadPicklistGroup(
	picklistDict: CompPicklistGroup,
	setStrikethroughs: (strikethroughs: number[]) => void,
	setPicklists: (picklists: Picklist[]) => void,
	updatePicklist: (picklist: Picklist) => void,
	deletePicklist: (picklist: Picklist) => void,
) {
	{
		setStrikethroughs(picklistDict.strikethroughs);

		setPicklists(
			Object.entries(picklistDict.picklists).map(([name, teams], index) => {
				const newPicklist: Picklist = {
					index,
					name,
					head: undefined,
					update: updatePicklist,
					delete: () => deletePicklist(newPicklist),
				};

				if (teams.length > 0) {
					let curr: PicklistEntry = {
						id: new ObjectId().toString(),
						number: teams[0],
						next: undefined,
						picklist: newPicklist,
					};
					newPicklist.head = curr;

					for (let i = 1; i < teams.length; i++) {
						curr.next = {
							number: teams[i],
							next: undefined,
							picklist: newPicklist,
							id: new ObjectId().toString(),
						};
						curr = curr.next;
					}
				}

				return newPicklist;
			}),
		);
	}
}
