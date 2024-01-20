import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

import { FaArrowRight, FaArrowLeft} from "react-icons/fa";

import {AutoPage, EndPage, TeleopPage} from "@/components/forms/FormPages"


export default function Homepage() {

    const { session, status } = useCurrentSession();

    const hide = status === "authenticated";

    return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full flex flex-col items-center space-y-2">
        
            
            <AutoPage></AutoPage>
            <TeleopPage></TeleopPage>
            <EndPage></EndPage>
            
            <footer className="w-full">
                <div className="card w-full bg-base-200">
                    <div className="card-body flex flex-col items-center">
                        <div className="card-actions justify-between w-full">
                            <button className="btn btn-primary">
                                <FaArrowLeft />
                                Auto
                            </button>
                            <h2 className=" text-blue-500 font-bold text-5xl">#4026</h2>

                            <button className="btn btn-primary">
                                End
                                <FaArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
    </div>

           
    </Container>

}