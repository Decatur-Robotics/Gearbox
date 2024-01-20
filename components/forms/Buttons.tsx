

export function AutoButtons(props: {}) {
    return <div className="flex flex-col w-full h-1/3 items-center justify-center">
                <div className="h-1/2 w-full flex flex-row">
                    <button className="btn btn-outline rounded-none rounded-tl-xl w-1/2 h-full text-lg">Scored Amp</button>
                    <button className="btn btn-outline rounded-none rounded-tr-xl w-1/2 h-full text-lg">Scored Speaker</button>
                </div>

                <div className="h-1/2 w-full flex flex-row">
                    <button className="btn btn-outline rounded-none rounded-bl-xl w-1/2 h-full text-lg">Missed Amp</button>
                    <button className="btn btn-outline rounded-none rounded-br-xl w-1/2 h-full text-lg">Missed Speaker</button>
                </div>
    </div>
             
}

export function TeleopButtons(props: {}) {
    return <div className="flex flex-col w-full h-1/2 items-center justify-center">
                <div className="h-1/2 w-full flex flex-row">
                    <button className="btn btn-outline rounded-none rounded-tl-xl w-1/3 h-full text-lg">Scored Amp</button>
                    <button className="btn btn-outline rounded-none  w-1/3 h-full text-lg">Scored Speaker</button>
                    <button className="btn btn-outline rounded-none rounded-tr-xl w-1/3 h-full text-lg">Scored Trap</button>
                </div>

                <div className="h-1/2 w-full flex flex-row">
                    <button className="btn btn-outline rounded-none rounded-bl-xl w-1/3 h-full text-lg">Missed Amp</button>
                    <button className="btn btn-outline rounded-none  w-1/3 h-full text-lg">Missed Speaker</button>
                    <button className="btn btn-outline rounded-none rounded-br-xl w-1/3 h-full text-lg">Missed Trap</button>
                </div>
    </div>
             
}