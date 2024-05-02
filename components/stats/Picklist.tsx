import { Report } from "@/lib/Types";

import { useDrag, useDrop } from "react-dnd";
import { ChangeEvent, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";

type CardType = { 
  number: number;
  id: number;
  picklist?: Picklist;
};

type Picklist = {
  index: number;
  name: string;
  teams: CardType[];
  update: (picklist: Picklist) => void;
}

const Includes = (bucket: any[], item: CardType) => {
  let result = false;
  bucket.forEach((i: { id: number }) => {
    if (i.id === item.id) {
      result = true;
    }
  });

  return result;
};

function TeamCard(props: { number: number; id: number; draggable: boolean, picklist?: Picklist }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: "team",
    item: { id: props.id, number: props.number },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      className="w-[150px] h-[100px] bg-base-100 rounded-lg p-1 flex items-center justify-center border-2 border-base-100 hover:border-primary"
      ref={dragRef}
    >
      <h1>
        Team <span className="text-accent">#{props.number}</span>
      </h1>
    </div>
  );
}

function PicklistCard(props: { picklist: Picklist }) {
  const picklist = props.picklist;

  const [basket, setBasket] = useState<CardType[]>([]);

  // build fix
  const [{ isOver }, dropRef] = useDrop({
    accept: "team",
    drop: (item: CardType) => 
      setBasket((basket: any) =>
        !Includes(basket, item) ? [...basket, {...item, picklist: props.picklist}] : basket,
      ),
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
      {basket.map((team) => (
        <TeamCard
          id={team.id}
          number={team.number}
          draggable={false}
          key={team.id}
          picklist={picklist}
        />
      ))}
      {isOver && <h1 className="font-semibold text-accent">Drop Here!</h1>}
    </div>
  );
}

export function TeamList(props: { teams: CardType[] }) {
  const [{ isOver}, dropRef] = useDrop({
    accept: "team",
    drop: (item: CardType) => {
      console.log(item);

      const picklist = item.picklist;
      if (!picklist) return;
      
      picklist.teams = picklist.teams.filter((team) => team.id !== item.id);
      picklist.update(picklist);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  return (
    <div ref={dropRef} className="w-full h-fit flex flex-row bg-base-300 space-x-2 p-2">
      {props.teams.map((team) => (
        <TeamCard
          draggable={true}
          id={team.id}
          number={team.number}
          key={team.id}
        ></TeamCard>
      ))}
    </div>);
}

export default function PicklistScreen(props: { reports: Report[] }) {
  const [teams, setTeams] = useState<CardType[]>([]);
  const [picklists, setPicklists] = useState<Picklist[]>([]);

  useEffect(() => {
    var newTeamNumbers: number[] = [];
    props.reports.forEach((report) => {
      if (!newTeamNumbers.includes(report.robotNumber)) {
        newTeamNumbers.push(report.robotNumber);
      }
    });

    setTeams(
      newTeamNumbers.map((num, index) => {
        return { id: index, number: num };
      }),
    );
  }, [props.reports]);

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
      <TeamList teams={teams}></TeamList>

      <div className="w-full h-[30rem] px-4 py-2 flex flex-row space-x-3">
        {picklists.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <h1 className="text-3xl text-accent animate-bounce font-semibold">
              Create A Picklist
            </h1>
          </div>
        ) : (
          <></>
        )}

        {picklists.map((picklist) => (
          <PicklistCard key={picklist.index} picklist={picklist}></PicklistCard>
        ))}
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
