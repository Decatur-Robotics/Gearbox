import { CompPicklistGroup, Report } from "@/lib/Types";
import { ConnectDropTarget, useDrag, useDrop } from "react-dnd";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FaPlus, FaStrikethrough, FaTrash } from "react-icons/fa";
import ClientApi from "@/lib/api/ClientApi";
import { ObjectId } from "bson";
import {
	PicklistEntry,
	Picklist,
	insertAfterEntry,
	setHeadOfPicklist,
	setTailOfPicklist,
	getPicklistLength,
	removeEntryFromItsPicklist,
	savePicklistGroup,
	loadPicklistGroup,
} from "@/lib/client/PicklistUtils";

// Be sure to disable for production!
const SHOW_PICKLISTS_ON_TEAM_CARDS = false;
const SHOW_CARD_IDS = false;

const api = new ClientApi();

function TeamCard(props: {
	entry: PicklistEntry;
	draggable: boolean;
	picklist?: Picklist;
	rank?: number;
	width?: string;
	preview?: boolean;
	strikeThroughs: number[];
	toggleStrikethrough?: (team: number) => void;
}) {
	const {
		entry,
		width,
		rank,
		preview,
		picklist,
		strikeThroughs,
		toggleStrikethrough,
	} = props;
	if (picklist) entry.picklist = picklist;

	const [, dragRef] = useDrag({
		type: "team",
		item: () => {
			return {
				...props.entry,
				id: props.entry.id ?? new ObjectId().toString(),
			};
		},
	});

	// We have the useDrop for the InsertDropSite here because we need to know if the dragged item is over the insert site
	const [{ isOverInsert, draggedEntry: draggedInsertEntry }, insertRef] =
		useDrop({
			accept: "team",
			drop: (dragged: PicklistEntry) => insertAfterEntry(entry, dragged),
			collect: (monitor) => ({
				isOverInsert: monitor.isOver(),
				draggedEntry: monitor.getItem(),
			}),
		});

	return (
		<>
			<div className="flex flex-col w-full">
				<div
					className={`w-${width ?? "full"} bg-base-100 rounded-lg p-1 flex items-center justify-center border-2 border-base-100 hover:border-primary ${preview && "animate-pulse border-primary"}`}
					ref={dragRef as unknown as () => void}
				>
					<h1
						className={
							strikeThroughs.includes(entry.number) ? "line-through" : ""
						}
					>
						{rank !== undefined ? `${rank}. ` : ""}
						<span className="max-sm:hidden">Team</span>{" "}
						<span className="text-accent">#{entry.number}</span>
						{SHOW_CARD_IDS && (
							<span className="text-secondary">
								.{entry.id?.slice(entry.id.length - 3)}
							</span>
						)}
						{SHOW_PICKLISTS_ON_TEAM_CARDS && entry.picklist && (
							<span className="text-xs text-accent">
								{" "}
								({entry.picklist.name})
							</span>
						)}
					</h1>
					{toggleStrikethrough && (
						<button
							className="btn btn-xs btn-ghost ml-1"
							onClick={() => toggleStrikethrough(entry.number)}
						>
							<FaStrikethrough />
						</button>
					)}
				</div>
				{rank && !preview && (
					<InsertDropSite
						rank={rank + 1}
						entry={entry}
						isOver={isOverInsert}
						dropRef={insertRef}
						draggedEntry={draggedInsertEntry}
						strikeThroughs={strikeThroughs}
					/>
				)}
			</div>
			{rank && !preview && entry.next && (
				<TeamCard
					rank={rank + (isOverInsert && draggedInsertEntry ? 2 : 1)}
					entry={entry.next}
					draggable={true}
					picklist={props.picklist}
					strikeThroughs={strikeThroughs}
					toggleStrikethrough={toggleStrikethrough}
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
	strikeThroughs,
}: {
	rank: number;
	entry: PicklistEntry;
	isOver: boolean;
	dropRef: ConnectDropTarget;
	draggedEntry: PicklistEntry;
	strikeThroughs: number[];
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
						strikeThroughs={strikeThroughs}
					/>
				</div>
			) : (
				<div className={`w-full ${entry.next ? "p-1" : "h-full"}`} />
			)}
		</div>
	);
}

function PicklistCard(props: { picklist: Picklist; strikethroughs: number[] }) {
	const picklist = props.picklist;

	const [{ isOver: isOverHead, entry: headEntry }, headDropRef] = useDrop({
		accept: "team",
		drop: (item: PicklistEntry) => setHeadOfPicklist(picklist, item),
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			entry: monitor.getItem(),
		}),
	});

	const [{ isOver: isOverTail, entry: tailEntry }, tailDropRef] = useDrop({
		accept: "team",
		drop: (item: PicklistEntry) => setTailOfPicklist(picklist, item),
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
		<div className="bg-base-200 min-h-[30rem] h-fit rounded-lg w-1/3 sm:w-1/6 flex flex-col items-center p-2 sm:p-4">
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
			<div className={`w-full grow flex flex-col ${!picklist.head && "mt-2"}`}>
				<div
					ref={headDropRef as any}
					className={`w-full ${!picklist.head ? "h-full" : "min-h-fit h-2"} flex justify-center`}
				>
					{picklist.head && isOverHead && (
						<div className={`w-full ${picklist.head && "my-2"}`}>
							<TeamCard
								entry={headEntry}
								draggable={false}
								rank={1}
								preview={true}
								strikeThroughs={props.strikethroughs}
							/>
						</div>
					)}
				</div>
				{picklist.head && (
					<TeamCard
						entry={picklist.head}
						draggable={false}
						picklist={picklist}
						rank={isOverHead ? 2 : 1}
						strikeThroughs={props.strikethroughs}
					/>
				)}
				<div
					ref={tailDropRef as any}
					className={`w-full h-full grow flex justify-center ${!picklist.head && "pt-2"}`}
				>
					{isOverTail ? (
						<div className="w-full -translate-y-2">
							<TeamCard
								entry={tailEntry}
								draggable={false}
								rank={getPicklistLength(picklist) + 1}
								preview={true}
								strikeThroughs={props.strikethroughs}
							/>
						</div>
					) : (
						!picklist.head && (
							<h1 className="text-center font-semibold text-accent">
								Drop Here!
							</h1>
						)
					)}
				</div>
			</div>
		</div>
	);
}

export function TeamList(props: {
	teams: PicklistEntry[];
	picklists: Picklist[];
	expectedTeamCount: number;
	strikethroughs: number[];
	toggleStrikethrough: (team: number) => void;
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
						strikeThroughs={props.strikethroughs}
						toggleStrikethrough={props.toggleStrikethrough}
					/>
				))}
			{props.teams.length !== props.expectedTeamCount && (
				<div className="loading loading-spinner" />
			)}
		</div>
	);
}

export default function PicklistScreen(props: {
	teams: number[];
	reports: Report[];
	expectedTeamCount: number;
	picklist: CompPicklistGroup;
	compId: ObjectId;
}) {
	const [picklists, setPicklists] = useState<Picklist[]>([]);

	enum LoadState {
		NotLoaded,
		Loading,
		Loaded,
	}

	const [loadingPicklists, setLoadingPicklists] = useState(LoadState.NotLoaded);

	const [strikethroughs, setStrikethroughs] = useState<number[]>([]);

	const teams = props.teams.map((team) => ({ number: team }));

	// Save picklists
	useEffect(() => {
		if (loadingPicklists !== LoadState.Loaded) return;
		savePicklistGroup(props.picklist._id.toString(), picklists, strikethroughs, api);
	}, [
		props.picklist._id,
		picklists,
		strikethroughs,
		LoadState.Loaded,
		loadingPicklists,
	]);

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

	const loadPicklistGroupMemo = useCallback(
		(picklistDict: CompPicklistGroup) =>
			loadPicklistGroup(
				picklistDict,
				setStrikethroughs,
				setPicklists,
				updatePicklist,
				deletePicklist,
			),
		[setStrikethroughs, setPicklists, updatePicklist, deletePicklist],
	);

	const toggleStrikethrough = useCallback(
		(team: number) => {
			setStrikethroughs((old) => {
				if (old.includes(team)) {
					return old.filter((t) => t !== team);
				} else {
					return [...old, team];
				}
			});
		},
		[setStrikethroughs],
	);

	// Load picklists
	useEffect(() => {
		if (loadingPicklists !== LoadState.NotLoaded) return;

		setLoadingPicklists(LoadState.Loading);
		api.getPicklistGroup(props.picklist?._id.toString()).then((picklist) => {
			if (picklist) {
				loadPicklistGroupMemo(picklist);
			}
		});
		loadPicklistGroupMemo(props.picklist);

		setLoadingPicklists(LoadState.Loaded);
	}, [
		loadingPicklists,
		LoadState.NotLoaded,
		LoadState.Loading,
		LoadState.Loaded,
		props.picklist,
		loadPicklistGroupMemo,
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
		drop: (item: PicklistEntry, monitor) => {
			if (monitor.didDrop()) return; // Check if another drop target handled the drop
			removeEntryFromItsPicklist(item);
		},
	});

	return (
		<div className="w-full h-fit flex flex-col space-y-2">
			<TeamList
				teams={teams}
				picklists={picklists}
				expectedTeamCount={props.expectedTeamCount}
				strikethroughs={strikethroughs}
				toggleStrikethrough={toggleStrikethrough}
			/>

			<div
				ref={dropRef as any}
				className="w-full min-h-[30rem] h-full px-4 py-2 flex flex-row space-x-3"
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
							strikethroughs={strikethroughs}
						/>
					))
				)}
			</div>

			{loadingPicklists !== LoadState.Loading && (
				<button
					className="max-sm:hidden btn btn-circle btn-lg btn-primary fixed right-10 bottom-10 animate-pulse font-bold "
					onClick={addPicklist}
				>
					<FaPlus />
				</button>
			)}
		</div>
	);
}
