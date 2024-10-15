import { BsGearFill } from "react-icons/bs";
import Image from "next/image";
import {
  FaBug,
  FaDiscord,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaList,
} from "react-icons/fa";
import { TbUfo } from "react-icons/tb";
import Link from "next/link";
import { MdAlternateEmail } from "react-icons/md";
import { HiStatusOnline } from "react-icons/hi";
import { useEffect, useState } from "react";

export default function Footer() {
  const [swStatus, setSwStatus] = useState("Finding service worker...");

  useEffect(() => {
    navigator.serviceWorker.getRegistration("/sw.js").then((registration) => {
      setSwStatus(registration ? `SW Status: ${registration.active?.state}` : "Service worker not found");
      console.log("Service worker registration: ", registration);
      if (registration) {
        registration.addEventListener("updatefound", () => {
          setSwStatus("Service worker update found");
          console.log("Service worker update found");
          registration.installing?.addEventListener("statechange", () => {
            console.log("Service worker state change: ", registration.installing?.state);
          });
        });

        registration.active?.addEventListener("statechange", () => {
          setSwStatus(`SW Status: ${registration.active?.state}`);
          console.log("Service worker state change: ", registration.active?.state);
        });

        registration.update().then(() => {
          console.log("Service worker update initiated");
        });
      }
    });
  }, []);

  return (
    <footer className="footer sm:p-10 bg-base-100 text-base-content border-t-8 border-base-300 max-sm:pt-4 max-sm:pb-8">
      <aside className="max-sm:pl-8 flex flex-col -space-x-4">
        <img src="/art/4026Bench.svg" className="w-32"></img>
        <p className="text-lg">
          Made with <span className="">❤️</span> by{" "}
          <a
            href="https://www.decaturrobotics.org/"
            className="inline-block text-bold text-accent"
          >
            Team 4026
          </a>
          <TbUfo size={30} className="inline ml-2" />
        </p>
        <div className="divider divider-vertical"> </div>
        <div className="flex flex-row space-x-2">
          <Link
            href={"https://www.instagram.com/decaturrobotics4026/?img_index=1"}
          >
            <FaInstagram size={30} className="ml-4" />
          </Link>
          <Link href={"https://www.facebook.com/DecaturRobotics4026/"}>
            <FaFacebook size={30} />
          </Link>
          <Link href={"https://github.com/Decatur-Robotics"}>
            <FaGithub size={30} />
          </Link>
          <Link href={"https://discord.gg/ha7AnqxFDD"}>
            <FaDiscord size={30} />
          </Link>
        </div>
      </aside>
      <nav className="max-sm:pl-8">
        <h6 className="footer-title">More</h6>
        <Link
          className="link link-hover"
          href="mailto:gearbox@decaturrobotics.org"
        >
          <MdAlternateEmail
            className="inline mr-1"
            size={16}
          />
          Contact
        </Link>
        <Link className="link link-hover" href="https://discord.gg/ha7AnqxFDD">
          <FaBug className="inline mr-1" size={16} />
          Bug Report/Feature Request
        </Link>
        <Link className="link link-hover" href={"https://status.4026.org/"}>
          <HiStatusOnline className="inline mr-1" size={16} />
          Status
        </Link>
        <Link
          className="link link-hover"
          href="https://www.decaturrobotics.org/our-team"
        >
          <FaList className="inline mr-1" size={16}/>About Us
        </Link>
      </nav>
      <nav className="max-sm:pl-8">
        <h6 className="footer-title">Debug</h6>
        <div>
          Version {(() => {
            const timestamp = new Date(+process.env.NEXT_PUBLIC_BUILD_TIME);
            return timestamp.toDateString() + " " + timestamp.toTimeString();
          })()}
        </div>
        <div>{swStatus}</div>
        <div>
          Size:{" "}
          <span className="xs:text-primary sm:text-accent md:text-secondary lg:underline lg:text-primary xl:text-accent 2xl:text-secondary">
            <span className="sm:hidden">
              XS
            </span>
            <span className="max-xs:hidden md:hidden">
              SM
            </span>
            <span className="max-sm:hidden lg:hidden">
              MD
            </span>
            <span className="max-md:hidden xl:hidden">
              LG
            </span>
            <span className="max-lg:hidden 2xl:hidden">
              XL
            </span>
            <span className="max-xl:hidden">
              2XL
            </span>
          </span>
        </div>
      </nav>
      <div className="max-sm:hidden flex-row flex space-x-4">
        <Link
          className="bg-indigo-600 p-4 rounded-lg text-white font-bold flex flex-row"
          href="https://www.thebluealliance.com/"
        >
          <Image
            src="/tba_lamp.svg"
            width="15"
            height="25"
            alt="tba"
            className="mr-6"
          />
          The Blue Alliance
        </Link>
        <div className="divider divider-horizontal" />
        <Link
          className="bg-gray-600 p-4 rounded-lg text-white font-bold flex flex-row"
          href="https://www.statbotics.io/"
        >
          <img
            src="/statbotics.webp"
            width="15"
            height="25"
            alt="tba"
            className="mr-6"
          />
          Statbotics
        </Link>
        <div className="divider divider-horizontal" />
        <Link
          className="bg-red-600 p-4 rounded-lg text-white font-bold flex flex-row"
          href="https://frc-events.firstinspires.org/services/api"
        >
          <img src="/FIRST.png" width="90" height="25" alt="tba" />
        </Link>
      </div>
    </footer>
  );
}
