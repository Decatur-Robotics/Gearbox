import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { BsGearFill } from "react-icons/bs";

export default function About(){
  const { session, status } = useCurrentSession();

  const hide = status === "authenticated";

  return(
  <Container requireAuthentication={false} hideMenu={!hide}>
    <div className="w-full min-h-screen flex lg:flex-row flex-col">
      <div className="hero min-h-screen bg-base-200 lg:w-1/2 w-full">
        <div className="hero-content">
          <div className="max-w-md flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-bold">
            <span className="text-4xl md:text-8xl text-accent drop-shadow-glowAccent">
              Gearbox{""}
            </span>
             {""}is a FRC scouting tool from team 4026
            </h1>
          </div>
         </div>
      </div>
      <div className="hero min-h-screen bg-base-200 lg:w-2/3 w-full">
          <div className="hero-content text-center w-full">
            <div className="w-full flex flex-col items-center sm:bg-base-200">
              <div className=" max-sm:hidden sm:w-2/3 h-full mockup-browser border-2 border-slate-800">
                <div className="mockup-browser-toolbar">
                  <div className="input border border-base-300">
                    https://4026.org/about
                  </div>
                </div>
                <div className="flex justify-center px-4 py-10 sm:border-t border-base-100">
                  <h1 className="z-10 absolute flex flex-row space-x-8 opacity-20">
                    <BsGearFill
                      size={200}
                    ></BsGearFill>
                    <BsGearFill
                      size={120}
                    ></BsGearFill>
                  </h1>
                  <div className="z-20 relative">
                    <h1 className="text-4 font-bold italic">
                      {`"Gearbox is a powerful (and easy to use) plug-and-play scouting tool that automatically
                      handles match creation, scouter assignment, and data visualization, while making pit
                      and match scouting as easy as tying your shoes. 
                      Our elegant and intuitive UI makes it simple to set up your team and start scouting.
                      All you need to do is register an account, register your team and have people join it,
                      create an event, and let gearbox handle the rest."`}
                    </h1>
                    <h1 className="text-lg font-light mt-2">- Renato Dell'Osso</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </Container>)
}