import { Report } from "@/lib/Types";

import { useDrag, useDrop } from "react-dnd";
import { ChangeEvent, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";

type CardData = { 
  number: number;
  id: number;
  picklist?: number;
};

type Picklist = {
  index: number;
  name: string;
  teams: CardData[];
  update: (picklist: Picklist) => void;
}

const Includes = (bucket: any[], item: CardData) => {
  let result = false;
  bucket.forEach((i: { id: number }) => {
    if (i.id === item.id) {
      result = true;
    }
  });

  return result;
};

function removeTeamFromPicklist(team: CardData, picklists: Picklist[]) {
  if (team.picklist === undefined) return;

  const picklist = picklists[team.picklist];
  if (!picklist) return;
  
  picklist.teams = picklist.teams.filter((team) => team.id !== team.id);
  picklist.update(picklist);
}

function TeamCard(props: { cardData: CardData, draggable: boolean, picklist?: Picklist, rank?: number, width?: string, height?: string}) {
  const { number: teamNumber, id, picklist } = props.cardData;

  const [{ isDragging }, dragRef] = useDrag({
    type: "team",
    item: props.cardData,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      className={`w-${props.width ?? "[150px]"} h-${props.height ?? "[100px]"} bg-base-100 rounded-lg p-1 flex items-center justify-center border-2 border-base-100 hover:border-primary`}
      ref={dragRef}
    >
      <h1>
        {props.rank !== undefined ? `${props.rank + 1}. ` : ""}Team <span className="text-accent">#{teamNumber}</span>
      </h1>
    </div>
  );
}

function  PicklistCard(props: { picklist: Picklist, picklists: Picklist[] }) {
  const picklist = props.picklist;

  const [{ isOver }, dropRef] = useDrop({
    accept: "team",
    drop: (item: CardData) => {
      if (item.picklist === picklist.index) return;

      removeTeamFromPicklist(item, props.picklists);

      if (!Includes(picklist.teams, item)) {
        item.picklist = picklist.index;
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
      className="bg-base-200 max-h-[30rem] rounded-lg w-1/6 min-h-32 flex flex-col items-center space-y-2 p-4"
      ref={dropRef}
    >
      <input defaultValue={picklist.name} className="w-[95%] input input-sm" onChange={changeName}></input>
      {picklist.teams.map((team, index) => (
        <TeamCard
          cardData={team}
          draggable={false}
          key={team.id}
          picklist={picklist}
          rank={index}
          width="full"
          height="[50px]"
        />
      ))}
      {isOver && <h1 className="font-semibold text-accent">Drop Here!</h1>}
    </div>
  );
}

export function TeamList(props: { teams: CardData[], picklists: Picklist[] }) {
  const [{ isOver}, dropRef] = useDrop({
    accept: "team",
    drop: (item: CardData) => {
      removeTeamFromPicklist(item, props.picklists);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  return (
    <div ref={dropRef} className="w-full h-fit flex flex-row bg-base-300 space-x-2 p-2 overflow-x-scroll">
      {props.teams.length > 0 ? props.teams.map((team) => (
        <TeamCard
          draggable={true}
          cardData={team}
          key={team.id}
        ></TeamCard>
      )) : 
      <progress className="progress w-full"></progress>}
    </div>);
}

export default function PicklistScreen(props: { teams: number[], reports: Report[] }) {
  const [picklists, setPicklists] = useState<Picklist[]>([]);

  const teams = props.teams.map((team) => ({ number: team, id: team }));

  const addPicklist = () => {
    const newPicklist: Picklist = {
      index: picklists.length,
      name: `Picklist ${picklists.length + 1}`,
      teams: [],
      update: (picklist: Picklist) => {
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
    };

    setPicklists([...picklists, newPicklist]);
  };

  return (
    <div className="w-full h-fit flex flex-col space-y-2">
      <TeamList teams={teams} picklists={picklists}></TeamList>

      <div className="w-full h-[30rem] px-4 py-2 flex flex-row space-x-3">
        {picklists.length === 0 
          ? (
          <div className="w-full h-full flex items-center justify-center">
            <h1 className="text-3xl text-accent animate-bounce font-semibold">
              Create A Picklist
            </h1>
          </div>
          )
          : picklists.map((picklist) => (
            <PicklistCard key={picklist.index} picklist={picklist} picklists={picklists}></PicklistCard>
          )
        )}
      </div>

      <button
        className="btn btn-circle btn-lg btn-primary absolute right-10 bottom-[21rem] animate-pulse font-bold "
        onClick={addPicklist}
      >
        <FaPlus></FaPlus>
      </button>
    </div>
  );
}
