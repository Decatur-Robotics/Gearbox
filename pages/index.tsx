import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FaDatabase, FaUserGroup } from "react-icons/fa6";
import { FaDiscord, FaUser, FaWifi } from "react-icons/fa";
import { BsGearFill } from "react-icons/bs";
import ClientAPI from "@/lib/client/ClientAPI";
import { IoPhonePortrait, IoPhonePortraitOutline } from "react-icons/io5";
import useIsVisible from "@/lib/client/useIsVisible";

const api = new ClientAPI("gearboxiscool");

export default function Homepage() {
  const { session, status } = useCurrentSession();
  const [counterData, setCounterData] = useState<{
    teams: number | null;
    users: number | null;
    datapoints: number | null;
    competitions: number | null;
  }>({
    teams: null,
    users: null,
    datapoints: null,
    competitions: null,
  });

  useEffect(() => {
    if (counterData.teams !== null) return;

    api.getMainPageCounterData().then((data) => {
      setCounterData(data);
    });
  });

  function formatDataPoint(num: number | null): string {
    if (num === null) return "?";

    return num.toLocaleString();
  }

  const hide = status === "authenticated";

  const secondSection = useRef<HTMLDivElement>(null);
  const secondVisible = useIsVisible(secondSection);

  const thirdSection = useRef<HTMLDivElement>(null);
  const thirdVisible = useIsVisible(thirdSection);

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      <div className="w-full min-h-screen flex lg:flex-row flex-col">
        <div className="hero pt-10 pb-10 md:min-h-screen bg-base-200 lg:w-1/2 w-full">
          <div className="hero-content">
            <div className="max-w-md flex flex-col items-center">
              <h1 className="text-4xl md:text-5xl font-bold">
                Welcome to{" "}
              </h1>
              <h1 className="font-bold text-6xl md:text-8xl text-accent drop-shadow-glowAccent">
                  Gearbox
              </h1>
              <p className="py-6 text-lg font-semibold text-center items-center">
                A fully customizable, modular scouting platform for{" "}
                <Link
                  href={"https://www.firstinspires.org/robotics/frc"}
                  className="text-accent"
                >
                  FIRST Robotics
                </Link>
              </p>
              <div className="flex flex-row space-x-4">
                <a
                  className="btn btn-lg btn-primary normal-case"
                  href="profile"
                >
                  Get Started
                </a>
                <a className="btn btn-lg btn-accent normal-case" href="profile">
                  Guide
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="hero min-h-screen bg-base-200 lg:w-2/3 w-full">
          <div className="hero-content text-center w-full">
            <div className="w-full flex flex-col items-center sm:bg-base-200">
              <div className=" max-sm:hidden sm:w-2/3 h-full mockup-browser border-2 border-slate-800">
                <div className="mockup-browser-toolbar">
                  <div className="input border border-base-300">
                    https://4026.org
                  </div>
                </div>
                <div className="flex justify-center px-4 py-16 sm:border-t border-base-100">
                  <h1 className="z-10 absolute flex flex-row space-x-8 opacity-20">
                    <BsGearFill
                      size={200}
                      className="animate-spin-slow"
                    ></BsGearFill>
                    <BsGearFill
                      size={120}
                      className="animate-spin-slow"
                    ></BsGearFill>
                  </h1>
                  <div className="z-20 relative">
                    <h1 className="text-4xl font-bold italic">
                      {`"Gearbox has allowed us to make strategic insights into the performance of other teams"`}
                    </h1>
                    <h1 className="text-lg font-light mt-2">- Team 4026</h1>
                  </div>
                </div>
              </div>
              <div className="sm:hidden mockup-phone">
                <div className="camera"></div>
                <div className="display">
                  <div className="artboard artboard-demo phone-1">
                    <div className="z-20 relative">
                    <div className="flex justify-center px-4 py-16 sm:border-t border-base-100">
                  <h1 className="z-10 absolute flex flex-col  md:flex-row space-x-8 opacity-20">
                    <BsGearFill
                      size={200}
                      className="animate-spin-slow text-8xl"
                    ></BsGearFill>
                    <BsGearFill
                      size={120}
                      className="animate-spin-slow max-sm:hidden"
                    ></BsGearFill>
                  </h1>
                  <div className="z-20 relative">
                    <h1 className="text-4xl font-bold italic">
                      {`"Gearbox has allowed us to make strategic insights into the performance of other teams"`}
                    </h1>
                    <h1 className="text-lg font-light mt-2">- Team 4026</h1>
                  </div>
                </div>
                    </div>
                    
                  </div>
                </div>
              </div>

              <div className="stats max-sm:w-4/5 max-sm:stats-vertical mt-6">
                <div className="stat place-items-center">
                  <div className="stat-title">Teams</div>
                  <div className="stat-figure text-primary">
                    <FaUserGroup size={30}></FaUserGroup>
                  </div>
                  {counterData.teams === null ? (
                    <div className="stat-value loading loading-spinner text-primary"></div>
                  ) : (
                    <div className="stat-value text-primary">
                      {formatDataPoint(counterData.teams)}
                    </div>
                  )}
                  <div className="stat-desc">Depend on Gearbox</div>
                </div>

                <div className="stat place-items-center">
                  <div className="stat-figure text-secondary">
                    <FaUser size={30}></FaUser>
                  </div>
                  <div className="stat-title">Users</div>
                  {counterData.teams === null ? (
                    <div className="stat-value loading loading-spinner text-secondary"></div>
                  ) : (
                    <div className="stat-value text-secondary">
                      {formatDataPoint(counterData.users)}
                    </div>
                  )}
                  <div className="stat-desc">Registered</div>
                </div>

                <div className="stat place-items-center">
                  <div className="stat-figure text-accent">
                    <FaDatabase size={30}></FaDatabase>
                  </div>
                  <div className="stat-title">Net Datapoints</div>
                  {counterData.teams === null ? (
                    <div className="stat-value loading loading-spinner text-accent"></div>
                  ) : (
                    <div className="stat-value text-accent">
                      {formatDataPoint(counterData.datapoints)}
                    </div>
                  )}
                  <div className="stat-desc">
                    Over {counterData.competitions ?? "..."} Competitions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={secondSection}
        className={`z-30 hero py-16 md:py-28 bg-base-300 w-full transition-opacity ease-in duration-1000 ${secondVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="hero-content w-full">
          <div className="w-2/3 space-y-2">
            <h1 className="text-4xl max-sm:text-3xl font-bold leading-relaxed text-center">
              Feature-packed and blazing fast
              <span className="animate-pulse">🔥</span>
            </h1>
            <ul className="list-disc translate-y-6  w-full text-lg">
              <li>
                Easy setup with{" "}
                <span className="text-accent">automatic match generation</span>{" "}
                and <span className="text-accent">assignment</span>
              </li>
              <li>
                Maximize your data with{" "}
                <span className="text-accent">pre-generated forms</span> for
                every aspect of play
              </li>
            </ul>
            <div className="divider translate-y-6"></div>
          </div>
          <div className="max-sm:hidden w-1/2 grid space-x-8 space-y-8 grid-cols-2 grid-row-2">
            <div className="card-bordered glass rounded-lg w-full animate-float-offset ml-10">
              <div className="p-4 font-mono">
                <span className="float-right -translate-y-2 ">
                  <IoPhonePortraitOutline
                    size={80}
                    className="opacity-50 rotate-12"
                  ></IoPhonePortraitOutline>
                </span>
                <p className="text-lg translate-y-4">Mobile Friendly</p>
              </div>
            </div>

            <div className="w-full"></div>
            <div className="w-full"></div>

            <div className="card-bordered glass rounded-lg w-full animate-float">
              <div className="p-5 font-mono">
                <span className="float-right -translate-y-3 ">
                  <FaWifi size={90} className="opacity-50 rotate-12"></FaWifi>
                </span>
                <p className="text-lg translate-y-2">Low-data Functionality</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={thirdSection}
        className={`hero py-14 sm:py-28 bg-base-100 w-full transition-transform ease-in duration-300 ${thirdVisible ? "scale-100" : "scale-0"}`}
      >
        <div className="hero-content w-full max-sm:pb-14">
          <div className="w-full space-y-2 grid grid-cols-1 sm:grid-cols-3 grid-rows-2 sm:space-x-10 z-20">
            <div className="relative w-full flex items-center justify-center">
              <div className="w-96 h-96 right-36 top-2 absolute bg-slate-600 opacity-20 rounded-xl animate-spin-slow -z-50"></div>
            </div>

            <div className="w-full flex flex-col items-center text-center bg-base-300 sm:p-4 rounded-xl border-2 border-base-300 hover:border-accent ">
              <p className="text-2xl font-bold">Insightful Visualizations</p>
              <div className="divider"></div>
              <p className="font-mono opacity-50">
                Graphs, heatmaps and textual insights are generated in real-time
              </p>
            </div>
            <div className="w-full flex items-center justify-center">
              <div className="w-80 h-80 absolute mask mask-hexagon bottom-40 bg-slate-600 opacity-50 rounded-full animate-spin-slow -z-50"></div>
            </div>
            <div className="w-full flex flex-col items-center text-center bg-base-300 p-4 rounded-xl border-2 border-base-300 hover:border-accent ">
              <p className="text-2xl font-bold">Minimal UI/UX</p>
              <div className="divider"></div>
              <p className="font-mono opacity-50">
                Designed from the ground-up to be intuitive to use
              </p>
            </div>
            <div className="w-full flex items-center justify-center"></div>
            <div className="w-full flex flex-col items-center text-center bg-base-300 p-4 rounded-xl border-2 border-base-300 hover:border-accent ">
              <p className="text-2xl font-bold">Integrated Team Management</p>
              <div className="divider"></div>
              <p className="font-mono opacity-50">
                Toggle and set responsibilities for your teammates
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hero w-full py-12 bg-base-300 mt-12">
        <div className="hero-content flex-col sm:flex-row-reverse">
          <iframe className="max-sm:hidden rounded-md" src="https://discord.com/widget?id=1219401473042157718&theme=dark" width="350" height="500" allowTransparency={true} sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
          <div className="w-2/3 flex flex-row">
            <div>
              <h1 className="text-5xl font-bold">Realtime Support</h1>
              <p className="mt-2">Join our Discord server for live support with our support staff.</p>
              <a href="https://discord.gg/dMNNbf7usj" className="btn btn-primary mt-4"><FaDiscord size={35}/> Join today</a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
