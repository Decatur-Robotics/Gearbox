
import { Report } from "@/lib/Types";

import { useDrag, useDrop } from 'react-dnd'
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { report } from "process";


type CardType = {number: number, id: number};

const Includes = (bucket: any[], item: CardType) => {
    let result = false;
    bucket.forEach((i: { id: number; }) => {
        if(i.id === item.id) {
            result = true;
        }
    });

    return result;
}


function TeamCard(props: {number: number, id: number, draggable: boolean}) {
    const [{ isDragging }, dragRef] = useDrag({
        type: 'team',
        item: { id: props.id, number: props.number },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    })

    return <div className="w-[150px] h-[100px] bg-base-100 rounded-lg p-1 flex items-center justify-center border-2 border-base-100 hover:border-primary" ref={dragRef}>
        <h1>Team <span className="text-accent">#{props.number}</span></h1>
    </div>
}

function Picklist(props: {index: number}) {
    const [basket, setBasket] = useState<CardType[]>([])

    const [{ isOver }, dropRef] = useDrop({
        accept: 'team',
        drop: (item) => setBasket((basket: any) => 
                            !Includes(basket, item) ? [...basket, item] : basket),
        collect: (monitor) => ({
            isOver: monitor.isOver()
        })
    })

    return <div className='bg-base-200 max-h-[30rem] rounded-lg w-1/6 min-h-32 flex flex-col items-center space-y-2 p-4' ref={dropRef}>
            <h1 className="font-semibold">Picklist #{props.index}</h1>
            {basket.map(team => <TeamCard id={team.id} number={team.number} draggable={false}/>)}
            {isOver && <h1 className="font-semibold text-accent">Drop Here!</h1>}
    </div>
}

export default function PicklistScreen(props: {reports: Report[]}) {
    const[teamNumbers, setTeamNumbers] = useState<CardType[]>([]);

    const [picklists, setPicklists] = useState<number[]>([]);

    useEffect(() => {
        var newTeamNumbers: number[] = [];
        props.reports.forEach((report) => {
            if(!newTeamNumbers.includes(report.robotNumber)) {
                newTeamNumbers.push(report.robotNumber);
            }
        });

        setTeamNumbers(newTeamNumbers.map((num, index) => { return {id: index, number: num} }));
    }, [props.reports])
    
    const addPicklist = () => {
        setPicklists([...picklists, picklists.length+1])
    }
    

    return <div className="w-full h-full flex flex-col space-y-2">
        
        <div className="w-full h-fit flex flex-row bg-base-300 space-x-2 p-2">
                {teamNumbers.map(team => <TeamCard draggable={true} id={team.id} number={team.number}></TeamCard>)}
        </div>
        
        <div className="w-full h-[30rem] px-4 py-2 flex flex-row space-x-3">
           {picklists.length === 0 ?  <div className="w-full h-full flex items-center justify-center">
            <h1 className="text-3xl text-accent animate-bounce font-semibold">Create A Picklist</h1>
            </div>: <></>}

           {
            picklists.map((num) =><Picklist key={num} index={num}></Picklist>)
           } 
        </div>

        <button className="btn btn-circle btn-lg btn-primary absolute right-10 bottom-0 animate-pulse font-bold " onClick={addPicklist}><FaPlus></FaPlus></button>
    </div>
}