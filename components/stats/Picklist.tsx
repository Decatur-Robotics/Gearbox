import { CompPicklistGroup, Report } from "@/lib/Types";

import { ConnectDropTarget, useDrag, useDrop } from "react-dnd";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import ClientApi from "@/lib/api/ClientApi";
import { ObjectId } from "bson";

const SHOW_PICKLISTS_ON_TEAM_CARDS = true;

type Picklist = {
	index: number;
	name: string;
	head: PicklistEntry | undefined;
	update: (picklist: Picklist) => void;
	delete: () => void;
};

type PicklistEntry = {
	number: number;
	next?: PicklistEntry;
	picklist?: Picklist;
	id?: string;
};

function removeEntryFromItsPicklist(entry: PicklistEntry) {
	if (entry.picklist) {
		const picklist = entry.picklist;
		if (picklist.head?.number === entry.number) {
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

function TeamCard(props: {
	entry: PicklistEntry;
	draggable: boolean;
	picklist?: Picklist;
	rank?: number;
	width?: string;
	preview?: boolean;
}) {
	const { entry, width, rank, preview, picklist } = props;
	if (picklist) entry.picklist = picklist;

	const [, dragRef] = useDrag({
		type: "team",
		item: () => {
			return props.entry;
		},
	});

	// We have the useDrop for the InsertDropSite here because we need to know if the dragged item is over the insert site
	const [{ isOverInsert, draggedEntry: draggedInsertEntry }, insertRef] =
		useDrop({
			accept: "team",
			drop: (dragged: PicklistEntry) => {
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
					number: dragged.number,
					next: entry.next,
					picklist: entry.picklist,
					id: dragged.id,
				};

				entry.next = dragged;

				console.log("Entry.next:", entry.next, entry.picklist?.head?.next);
				console.log("Head equal:", entry === entry.picklist?.head);
				console.log(
					"Picklists equal:",
					entry.picklist === entry.next?.picklist &&
						entry.picklist === picklist,
				);

				entry.picklist?.update(entry.picklist);
			},
			collect: (monitor) => ({
				isOverInsert: monitor.isOver(),
				draggedEntry: monitor.getItem(),
			}),
		});

	return (
		<>
			<div className="flex flex-col w-full">
				<div
					className={`w-${width ?? "full"} bg-base-100 rounded-lg p-1 flex items-center justify-center border-2 border-base-100 hover:border-primary ${preview && "animate-pulse"}`}
					ref={dragRef as unknown as () => void}
				>
					<h1>
						{rank !== undefined ? `${rank}. ` : ""}
						<span className="max-sm:hidden">Team</span>{" "}
						<span className="text-accent">#{entry.number}</span>
						{SHOW_PICKLISTS_ON_TEAM_CARDS && entry.picklist && (
							<span className="text-xs text-accent">
								{" "}
								({entry.picklist.name})
							</span>
						)}
					</h1>
				</div>
				{rank && !preview && (
					<InsertDropSite
						rank={rank + 1}
						entry={entry}
						isOver={isOverInsert}
						dropRef={insertRef}
						draggedEntry={draggedInsertEntry}
					/>
				)}
			</div>
			{rank && !preview && entry.next && (
				<TeamCard
					rank={rank + (isOverInsert && draggedInsertEntry ? 2 : 1)}
					entry={entry.next}
					draggable={true}
					picklist={props.picklist}
				/>
			)}
		</>
	);
}

/**
 * The useDrop is in the TeamCard component
 */
function InsertDropSite({
	rank,
	entry,
	isOver,
	dropRef,
	draggedEntry,
}: {
	rank: number;
	entry: PicklistEntry;
	isOver: boolean;
	dropRef: ConnectDropTarget;
	draggedEntry: PicklistEntry;
}) {
	return (
		<div
			ref={dropRef as any}
			className={`w-full ${entry.next ? "h-full" : "h-4"}`}
		>
			{isOver ? (
				<div className="w-full my-2">
					<TeamCard
						entry={draggedEntry}
						draggable={false}
						rank={rank}
						preview={true}
					/>
				</div>
			) : (
				<div className={`w-full ${entry.next ? "p-1" : "h-full"}`} />
			)}
		</div>
	);
}

function PicklistCard(props: { picklist: Picklist }) {
	const picklist = props.picklist;

	const [{ isOver, entry }, dropRef] = useDrop({
		accept: "team",
		drop: (item: PicklistEntry) => {
			removeEntryFromItsPicklist(item);

			item = {
				number: item.number,
				next: picklist.head,
				picklist,
				id: item.id,
			};
			picklist.head = item;

			picklist.update(picklist);
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			entry: monitor.getItem(),
		}),
	});

	function changeName(e: ChangeEvent<HTMLInputElement>) {
		picklist.name = e.target.value;
		picklist.update(picklist);
	}

	return (
		<div className="bg-base-200 h-full rounded-lg w-1/3 sm:w-1/6 min-h-32 flex flex-col items-center p-2 sm:p-4">
			<div className="flex flex-row items-center">
				<input
					defaultValue={picklist.name}
					className="w-[95%] input input-sm max-sm:hidden"
					onChange={changeName}
				/>
				<h1 className="w-[95%] input input-sm input-disabled sm:hidden">
					{picklist.name}
				</h1>
				<button className="btn btn-xs btn-ghost ml-1">
					<FaTrash
						onClick={() =>
							confirm(`Are you sure you want to delete ${picklist.name}?`) &&
							picklist.delete()
						}
					/>
				</button>
			</div>
			<div
				className={`w-full h-full flex flex-col ${!picklist.head && "mt-2"}`}
			>
				<div
					ref={dropRef as any}
					className={`w-full ${!picklist.head ? "h-full" : "min-h-fit h-2"} flex justify-center text-center`}
				>
					{isOver ? (
						<div className={`w-full ${picklist.head && "my-2"}`}>
							<TeamCard
								entry={entry}
								draggable={false}
								rank={1}
								preview={true}
							/>
						</div>
					) : (
						!picklist.head && (
							<h1 className="font-semibold text-accent">Drop Here!</h1>
						)
					)}
				</div>
				{picklist.head && (
					<TeamCard
						entry={picklist.head}
						draggable={false}
						picklist={picklist}
						rank={isOver ? 2 : 1}
					/>
				)}
			</div>
		</div>
	);
}

export function TeamList(props: {
	teams: PicklistEntry[];
	picklists: Picklist[];
	expectedTeamCount: number;
}) {
	const [, dropRef] = useDrop({
		accept: "team",
		drop: removeEntryFromItsPicklist,
	});

	return (
		<div
			ref={dropRef as any}
			className="w-full h-fit flex flex-row bg-base-300 space-x-2 p-2 overflow-x-scroll"
		>
			{props.teams
				.sort((a, b) => a.number - b.number)
				.map((team) => (
					<TeamCard
						draggable={true}
						entry={team}
						key={team.number}
					/>
				))}
			{props.teams.length !== props.expectedTeamCount && (
				<div className="loading loading-spinner" />
			)}
		</div>
	);
}

const api = new ClientApi();

export default function PicklistScreen(props: {
	teams: number[];
	reports: Report[];
	expectedTeamCount: number;
	picklist: CompPicklistGroup;
	compId: string;
}) {
	const [picklists, setPicklists] = useState<Picklist[]>([]);

	enum LoadState {
		NotLoaded,
		Loading,
		Loaded,
	}

	const [loadingPicklists, setLoadingPicklists] = useState(LoadState.NotLoaded);

	const teams = props.teams.map((team) => ({ number: team }));

	useEffect(() => {
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
				_id: props.picklist._id,
				picklists: {},
			},
		);

		api.updatePicklist(picklistDict);
	}, [props.picklist._id, picklists]);

	const updatePicklist = useCallback(
		(picklist: Picklist) => {
			setPicklists((old) => {
				const newPicklists = old.map((p) => {
					if (p.index === picklist.index) {
						return picklist;
					} else {
						return p;
					}
				});

				return newPicklists;
			});
		},
		[setPicklists],
	);

	const deletePicklist = useCallback(
		(picklist: Picklist) => {
			setPicklists((old) => {
				const newPicklists = old.filter((p) => p.index !== picklist.index);
				return newPicklists;
			});
		},
		[setPicklists],
	);

	const loadCompPicklistGroup = useCallback(
		(picklistDict: CompPicklistGroup) => {
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
							number: teams[0],
							next: undefined,
							picklist: newPicklist,
							id: new ObjectId().toHexString(),
						};
						newPicklist.head = curr;

						for (let i = 1; i < teams.length; i++) {
							curr.next = {
								number: teams[i],
								next: undefined,
								picklist: newPicklist,
								id: new ObjectId().toHexString(),
							};
							curr = curr.next;
						}
					}

					return newPicklist;
				}),
			);
		},
		[updatePicklist],
	);

	useEffect(() => {
		if (loadingPicklists !== LoadState.NotLoaded) return;

		setLoadingPicklists(LoadState.Loading);
		api.getPicklist(props.picklist?._id).then((picklist) => {
			if (picklist) {
				loadCompPicklistGroup(picklist);
			}
		});
		loadCompPicklistGroup(props.picklist);

		setLoadingPicklists(LoadState.Loaded);
	}, [
		loadingPicklists,
		LoadState.NotLoaded,
		LoadState.Loading,
		LoadState.Loaded,
		props.picklist,
		loadCompPicklistGroup,
	]);

	const addPicklist = () => {
		const newPicklist: Picklist = {
			index: picklists.length,
			name: `Picklist ${picklists.length + 1}`,
			head: undefined,
			update: updatePicklist,
			delete: () => deletePicklist(newPicklist),
		};

		const newPicklists = [...picklists, newPicklist];
		setPicklists(newPicklists);
	};

	const [, dropRef] = useDrop({
		accept: "team",
		drop: removeEntryFromItsPicklist,
	});

	return (
		<div className="w-full h-fit flex flex-col space-y-2">
			<TeamList
				teams={teams}
				picklists={picklists}
				expectedTeamCount={props.expectedTeamCount}
			/>

			<div
				ref={dropRef as any}
				className="w-full min-h-[30rem] h-[30rem] px-4 py-2 flex flex-row space-x-3"
			>
				{loadingPicklists === LoadState.Loading ? (
					<div className="w-full h-full flex items-center justify-center">
						<div className="loading loading-spinner" />
					</div>
				) : picklists.length === 0 ? (
					<div className="w-full h-full flex items-center justify-center">
						<h1 className="text-3xl text-accent animate-bounce font-semibold">
							Create A Picklist
						</h1>
					</div>
				) : (
					picklists.map((picklist) => (
						<PicklistCard
							key={picklist.index}
							picklist={picklist}
						/>
					))
				)}
			</div>

			{loadingPicklists !== LoadState.Loading && (
				<button
					className="max-sm:hidden btn btn-circle btn-lg btn-primary absolute right-10 bottom-[21rem] animate-pulse font-bold "
					onClick={addPicklist}
				>
					<FaPlus />
				</button>
			)}
		</div>
	);
}
