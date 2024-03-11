import {BsGearFill} from "react-icons/bs"
import Image from "next/image"
export default function Footer() {
    return <footer className="footer p-10 bg-base-100 text-base-content">
    <aside>

      <p className="text-lg">Made with ❤️ by <a href="https://www.decaturrobotics.org/" className="text-primary text-bold">Team 4026</a></p>
    </aside> 
    <nav>
      <h6 className="footer-title">Help</h6> 
      <a className="link link-hover">Contact</a>
    </nav>
    <div className="flex-row flex space-x-4">
      <a className="bg-indigo-600 p-4 rounded-lg text-white font-bold flex flex-row" href="https://www.thebluealliance.com/">
        <Image src="/tba_lamp.svg" width="15" height="25" alt="tba" className="mr-6"></Image>
        The Blue Alliance
      </a>
      <div className="divider divider-horizontal"></div>
      <a className="bg-gray-600 p-4 rounded-lg text-white font-bold flex flex-row" href="https://www.statbotics.io/">
        <img src="/statbotics.webp" width="15" height="25" alt="tba" className="mr-6"></img>
        Statbotics
      </a>
      <div className="divider divider-horizontal"></div>
      <a className="bg-red-600 p-4 rounded-lg text-white font-bold flex flex-row" href="https://frc-events.firstinspires.org/services/api">
        <img src="/FIRST.png" width="90" height="25" alt="tba"></img>
      </a>
    </div>
      
  </footer>
}