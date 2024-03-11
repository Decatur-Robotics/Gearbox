import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaDatabase, FaUserGroup } from "react-icons/fa6";
import { FaUser } from "react-icons/fa";
import { BsGearFill } from "react-icons/bs";

export default function Homepage() {
  const { session, status } = useCurrentSession();
  const hide = status === "authenticated";

  return (
    <Container requireAuthentication={false} hideMenu={!hide}>
      <div className="w-full min-h-screen flex lg:flex-row flex-col  ">
        <div className="hero min-h-screen bg-base-200 lg:w-1/2 w-full">
          <div className="hero-content">
            <div className="max-w-md flex flex-col items-center">
              <h1 className="text-5xl font-bold">
                Welcome to{" "}
                <span className="text-8xl text-accent drop-shadow-glowAccent">
                  Gearbox
                </span>
              </h1>
              <p className="py-6 text-lg font-semibold">
                A fully customizable, modular scouting platform for{" "}
                <Link
                  href={"https://www.firstinspires.org/robotics/frc"}
                  className="text-accent"
                >
                  FIRST Robotics
                </Link>
              </p>
              <p className="font-mono text-yellow-500"></p>
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
            <div className="w-full flex flex-col items-center">
              <div className="w-2/3 h-full mockup-browser border-2 border-slate-800">
                <div className="mockup-browser-toolbar">
                  <div className="input border border-base-300">
                    https://4026.org
                  </div>
                </div>
                <div className="flex justify-center px-4 py-16 border-t border-base-100">
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
                      "Gearbox has allowed us to make strategic insights into
                      the performance of other teams"
                    </h1>
                    <h1 className="text-lg font-light mt-2">- Team 4026</h1>
                  </div>
                </div>
              </div>

              <div className="stats mt-6">
                <div className="stat place-items-center">
                  <div className="stat-title">Teams</div>
                  <div className="stat-figure text-primary">
                    <FaUserGroup size={30}></FaUserGroup>
                  </div>
                  <div className="stat-value text-primary">3</div>
                  <div className="stat-desc">Depend on Gearbox</div>
                </div>

                <div className="stat place-items-center">
                  <div className="stat-figure text-secondary">
                    <FaUser size={30}></FaUser>
                  </div>
                  <div className="stat-title">Users</div>
                  <div className="stat-value text-secondary">{30}</div>
                  <div className="stat-desc">Registered</div>
                </div>

                <div className="stat place-items-center">
                  <div className="stat-figure text-accent">
                    <FaDatabase size={30}></FaDatabase>
                  </div>
                  <div className="stat-title">Net Datapoints</div>
                  <div className="stat-value text-accent">12.6K</div>
                  <div className="stat-desc">Over 3 Competitions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
