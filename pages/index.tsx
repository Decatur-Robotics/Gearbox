import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";

export default function Homepage() {

    const { session, status } = useCurrentSession();

    const hide = status === "authenticated";

    return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full min-h-screen flex flex-col">
            <div className="hero min-h-screen bg-base-200">
                <div className="hero-content text-center">
                    
                    
                    <div className="max-w-md flex flex-col items-center">
                        <img src="/robot.jpg.png" className="w-5/6"></img>
                        <h1 className="text-5xl font-bold">Welcome to <span className="text-accent">Gearbox</span></h1>
                        <p className="py-6">A Fully Customizable, Modular Scouting Platform For FIRST Robotics</p>
                        <a className="btn btn-primary normal-case" href="profile">Get Started</a>
                    </div>
                </div>
            </div>
        </div>
           
    </Container>

}