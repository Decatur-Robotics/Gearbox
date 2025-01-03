import { DbPicklist, Report } from "@/lib/Types";

import { useDrag, useDrop } from "react-dnd";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaPlus } from "react-icons/fa";
import ClientApi from "@/lib/api/ClientApi";

type CardData = {
	number: number;
	picklistIndex?: number;
};

type Picklist = {
	index: number;
	name: string;
	teams: CardData[];
	update: (picklist: Picklist) => void;
};

const Includes = (bucket: any[], item: CardData) => {
	let result = false;
	bucket.forEach((i: { number: number }) => {
		if (i.number === item.number) {
			result = true;
		}
	});

	return result;
};

function removeTeamFromPicklist(team: CardData, picklists: Picklist[]) {
	if (team.picklistIndex === undefined) return;

	const picklist = picklists[team.picklistIndex];
	if (!picklist) return;

	picklist.teams = picklist.teams.filter((t) => t.number !== team.number);
	picklist.update(picklist);
}

function TeamCard(props: {
	cardData: CardData;
	draggable: boolean;
	picklist?: Picklist;
	rank?: number;
	lastRank?: number;
	width?: string;
	height?: string;
}) {
	const { number: teamNumber, picklistIndex: picklist } = props.cardData;

	const [{ isDragging }, dragRef] = useDrag({
		type: "team",
		item: props.cardData,
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	function changeTeamRank(change: number) {
		const picklist = props.picklist;
		if (
			picklist === undefined ||
			props.rank === undefined ||
			props.lastRank === undefined
		)
			return;

		const newRank = props.rank + change;
		if (newRank < 0 || newRank > props.lastRank) return;

		const otherTeam = picklist.teams[newRank];
		picklist.teams[newRank] = picklist.teams[props.rank];
		picklist.teams[props.rank] = otherTeam;

		picklist.update(picklist);
	}

	return (
		<div
			className={`w-${props.width ?? "[150px]"} h-${props.height ?? "[100px]"} bg-base-100 rounded-lg p-1 flex items-center justify-center border-2 border-base-100 hover:border-primary`}
			ref={dragRef as unknown as () => void}
		>
			<h1>
				{props.rank !== undefined ? `${props.rank + 1}. ` : ""}
				<span className="max-sm:hidden">Team</span>{" "}
				<span className="text-accent">#{teamNumber}</span>
			</h1>
			{props.rank !== undefined && props.lastRank && props.picklist ? (
				<div className="ml-2 space-x-1">
					{props.rank > 0 && (
						<button
							className="btn btn-primary btn-sm"
							onClick={() => changeTeamRank(-1)}
						>
							<FaArrowUp />
						</button>
					)}
					{props.rank < props.lastRank && (
						<button
							className="btn btn-primary btn-sm"
							onClick={() => changeTeamRank(1)}
						>
							<FaArrowDown />
						</button>
					)}
				</div>
			) : (
				""
			)}
		</div>
	);
}

function PicklistCard(props: { picklist: Picklist; picklists: Picklist[] }) {
	const picklist = props.picklist;

	const [{ isOver }, dropRef] = useDrop({
		accept: "team",
		drop: (item: CardData) => {
			if (item.picklistIndex === picklist.index) return;

			removeTeamFromPicklist(item, props.picklists);

			if (!Includes(picklist.teams, item)) {
				item.picklistIndex = picklist.index;
				picklist.teams.push(item);
				picklist.update(picklist);
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
		}),
	});

	function changeName(e: ChangeEvent<HTMLInputElement>) {
		picklist.name = e.target.value;
		picklist.update(picklist);
	}

	return (
		<div
			className="bg-base-200 min-h-[30rem] h-fit rounded-lg w-1/3 sm:w-1/6 min-h-32 flex flex-col items-center space-y-2 p-2 sm:p-4"
			ref={dropRef as unknown as () => void}
		>
			<input
				defaultValue={picklist.name}
				className="w-[95%] input input-sm max-sm:hidden"
				onChange={changeName}
			/>
			<h1 className="w-[95%] input input-sm input-disabled sm:hidden">
				{picklist.name}
			</h1>
			{picklist.teams.map((team, index) => (
				<TeamCard
					cardData={team}
					draggable={false}
					key={team.number}
					picklist={picklist}
					rank={index}
					lastRank={picklist.teams.length - 1}
					width="full"
					height="[50px]"
				/>
			))}
			{isOver && <h1 className="font-semibold text-accent">Drop Here!</h1>}
		</div>
	);
}

export function TeamList(props: {
	teams: CardData[];
	picklists: Picklist[];
	expectedTeamCount: number;
}) {
	const [{ isOver }, dropRef] = useDrop({
		accept: "team",
		drop: (item: CardData) => {
			removeTeamFromPicklist(item, props.picklists);
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
		}),
	});

	return (
		<div
			ref={dropRef as unknown as () => void}
			className="w-full h-fit flex flex-row bg-base-300 space-x-2 p-2 overflow-x-scroll"
		>
			{props.teams
				.sort((a, b) => a.number - b.number)
				.map((team) => (
					<TeamCard
						draggable={true}
						cardData={team}
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
	picklist: DbPicklist;
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

	const savePicklists = useCallback(
		(picklists: Picklist[]) => {
			const picklistDict = picklists.reduce<DbPicklist>(
				(acc, picklist) => {
					acc.picklists[picklist.name] = picklist.teams.map(
						(team) => team.number,
					);
					return acc;
				},
				{
					_id: props.picklist._id,
					picklists: {},
				},
			);

			api.updatePicklist(picklistDict);
		},
		[props.picklist._id],
	);

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

				savePicklists(newPicklists);
				return newPicklists;
			});
		},
		[setPicklists, savePicklists],
	);

	const loadDbPicklist = useCallback(
		(picklistDict: DbPicklist) => {
			setPicklists(
				Object.entries(picklistDict.picklists).map((picklist, index) => {
					const newPicklist: Picklist = {
						index,
						name: picklist[0],
						teams: picklist[1].map((team: number) => ({ number: team })),
						update: updatePicklist,
					};

					for (const team of newPicklist.teams) {
						team.picklistIndex = newPicklist.index;
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
				loadDbPicklist(picklist);
			}
		});
		loadDbPicklist(props.picklist);

		setLoadingPicklists(LoadState.Loaded);
	}, [
		loadingPicklists,
		LoadState.NotLoaded,
		LoadState.Loading,
		LoadState.Loaded,
		props.picklist,
		loadDbPicklist,
	]);

	const addPicklist = () => {
		const newPicklist: Picklist = {
			index: picklists.length,
			name: `Picklist ${picklists.length + 1}`,
			teams: [],
			update: updatePicklist,
		};

		const newPicklists = [...picklists, newPicklist];
		savePicklists(newPicklists);
		setPicklists(newPicklists);
	};

	return (
		<div className="w-full h-fit flex flex-col space-y-2">
			<TeamList
				teams={teams}
				picklists={picklists}
				expectedTeamCount={props.expectedTeamCount}
			></TeamList>

			<div className="w-full min-h-[30rem] h-fit px-4 py-2 flex flex-row space-x-3">
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
							picklists={picklists}
						></PicklistCard>
					))
				)}
			</div>

			{loadingPicklists !== LoadState.Loading && (
				<button
					className="max-sm:hidden btn btn-circle btn-lg btn-primary absolute right-10 bottom-[21rem] animate-pulse font-bold "
					onClick={addPicklist}
				>
					<FaPlus></FaPlus>
				</button>
			)}
		</div>
	);
}
