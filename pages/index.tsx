import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useState } from "react";

export default function Homepage() {

    const { session, status } = useCurrentSession();
    const [clickTimes, setClickTimes] = useState<number>(1);
    const [oValue, setOValue] = useState<string>('ox');
    const [imageSrc, setImageSrc] = useState<string>('/robot.jpg.png')
    const [buttonText, setButtonText] = useState<string>('Started')
    const [typed, setTyped] = useState<string>('')

    function handleClickO(){
        setClickTimes(clickTimes+1)
        if (clickTimes == 4) {
            setOValue("Owen")
            setImageSrc("https://i.imgur.com/isKWyjK.png")
            setButtonText('Owening')
        }
    }
    

    const hide = status === "authenticated";

    return <Container requireAuthentication={false} hideMenu={!hide}>
        <div className="w-full min-h-screen flex flex-col  ">
            <div className="hero min-h-screen bg-base-200 ">
                <div className="hero-content text-center">
                    
                    <div className="max-w-md flex flex-col items-center">
                        <img src={imageSrc} className="w-5/6"></img>
                        <h1 className="text-5xl font-bold">Welcome to <span className="text-accent">Gearb<span style={{userSelect: 'none'}}onClick={handleClickO}>{oValue}</span></span></h1>
                        <p className="py-6">A Fully Customizable, Modular Scouting Platform For FIRST Robotics</p>
                        <a className="btn btn-primary normal-case" href="profile">Get {buttonText}</a>
                    </div>
                </div>
            </div>
        </div>
           
    </Container>

}