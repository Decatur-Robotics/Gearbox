import { BsGearFill } from "react-icons/bs";
import Image from "next/image";
import { FaBug, FaFacebook, FaGithub, FaInstagram, FaList } from "react-icons/fa";
import { TbUfo } from "react-icons/tb";
import Link from "next/link";
import { MdAlternateEmail } from "react-icons/md";
export default function Footer() {
  return (
    <footer className="footer sm:p-10 bg-base-100 text-base-content border-t-8 border-base-300 max-sm:pt-4 max-sm:pb-8">
      
      <aside className="max-sm:pl-8 flex flex-col -space-x-4">
        <p className="text-lg">Made with ❤️ by{" "}
          
          <a
            href="https://www.decaturrobotics.org/"
            className="inline-block text-bold text-accent"
          >
            Team 4026
            
          </a>
          <TbUfo size={30} className="animate-bounce inline ml-2"></TbUfo>
        </p>
        <div className="divider divider-vertical"> </div>
        <div className="flex flex-row space-x-2">
          <Link href={"https://www.instagram.com/decaturrobotics4026/?img_index=1"}><FaInstagram size={30} className="ml-4"></FaInstagram></Link>
          <Link href={"https://www.facebook.com/DecaturRobotics4026/"}><FaFacebook size={30}></FaFacebook></Link>
          <Link href={"https://github.com/Decatur-Robotics"}><FaGithub size={30}></FaGithub></Link>
        </div>
        
      </aside>
      <nav className="max-sm:pl-8">
        <h6 className="footer-title">More</h6>
        <a className="link link-hover" href="mailto:gearbox@decaturrobotics.org"><MdAlternateEmail className="inline mr-1" size={16}></MdAlternateEmail>Contact</a>
        <a className="link link-hover"><FaBug className="inline mr-1" size={16}></FaBug>Bug Report/Feature Request</a>
      </nav>
      <nav className="max-sm:pl-8">
        <h6 className="footer-title">About</h6>
        <a className="link link-hover"><FaList className="inline mr-1" size={16}></FaList>About Us</a>
      </nav>
      <div className="max-sm:hidden flex-row flex space-x-4">
        <a
          className="bg-indigo-600 p-4 rounded-lg text-white font-bold flex flex-row"
          href="https://www.thebluealliance.com/"
        >
          <Image
            src="/tba_lamp.svg"
            width="15"
            height="25"
            alt="tba"
            className="mr-6"
          ></Image>
          The Blue Alliance
        </a>
        <div className="divider divider-horizontal"></div>
        <a
          className="bg-gray-600 p-4 rounded-lg text-white font-bold flex flex-row"
          href="https://www.statbotics.io/"
        >
          <img
            src="/statbotics.webp"
            width="15"
            height="25"
            alt="tba"
            className="mr-6"
          ></img>
          Statbotics
        </a>
        <div className="divider divider-horizontal"></div>
        <a
          className="bg-red-600 p-4 rounded-lg text-white font-bold flex flex-row"
          href="https://frc-events.firstinspires.org/services/api"
        >
          <img src="/FIRST.png" width="90" height="25" alt="tba"></img>
        </a>
      </div>
    </footer>
  );
}
