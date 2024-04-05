import { BsGearFill } from "react-icons/bs";

export default function Pamphlet() {
  return (
    <div className="bg-white text-black">
      <div className="h-[5.5in] w-[8.5in]">
        <div className="card w-full h-full">
          <div className="px-4 py-2">
            <h1 className="font-bold text-7xl">
              <BsGearFill className="inline" /> Gearbox{" "}
              <span className="text-3xl relative bottom-2 bg-accent px-4 p-3 rounded-full text-white">
                BETA
              </span>
            </h1>
            <p className="text-3xl font-mono ml-20 relative bottom-2">
              By{" "}
              <span className="text-accent relative">
                Decatur Robotics 4026
              </span>{" "}
            </p>

            <div className="relative -translate-y-4">
              <div className="divider"></div>
              <p className="text-3xl font-semibold bg-slate-200 p-4 rounded-xl -translate-y-2">
                Partnered Teams
              </p>

              <ul className=" list-disc ml-12 font-mono">
                <li className="text-xl">Wolverines - 6944</li>
                <li className="text-xl">Grayson Robotics - 8100</li>
                <li className="text-xl">AHS Tigers - 8761</li>
                <li className="text-xl font-bold">
                  The Fighting Mongooses - 5900
                </li>
                <li className="text-xl font-bold">Techno Titans - 1683</li>
                <li className="text-xl font-bold">
                  Cyber Academy of Champions - 1683
                </li>
                <li className="text-xl font-bold">Avenger Robotics - 7451</li>
                <li className="text-xl font-bold">Robo Lions - 1261</li>
                <li className="text-xl font-bold">Phoenix - 4533</li>
              </ul>

              <div className="w-full flex items-center justify-center -translate-y-2">
                <div className="btn btn-primary w-1/3 text-2xl">
                  Live at 4026.org
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[5.5in] w-[8.5in]">
        <div className="card w-full h-full">
          <div className="px-4 py-2">
            <h1 className="font-bold text-7xl">
              <BsGearFill className="inline" /> Gearbox{" "}
              <span className="text-3xl relative bottom-2 bg-accent px-4 p-3 rounded-full text-white">
                BETA
              </span>
            </h1>
            <p className="text-3xl font-mono ml-20 relative bottom-2">
              By{" "}
              <span className="text-accent relative">
                Decatur Robotics 4026
              </span>{" "}
            </p>

            <div className="relative -translate-y-4">
              <div className="divider"></div>
              <p className="text-3xl font-semibold bg-slate-200 p-4 rounded-xl -translate-y-2">
                Partnered Teams
              </p>

              <ul className=" list-disc ml-12 font-mono">
                <li className="text-xl">Wolverines - 6944</li>
                <li className="text-xl">Grayson Robotics - 8100</li>
                <li className="text-xl">AHS Tigers - 8761</li>
                <li className="text-xl font-bold">
                  The Fighting Mongooses - 5900
                </li>
                <li className="text-xl font-bold">Techno Titans - 1683</li>
                <li className="text-xl font-bold">
                  Cyber Academy of Champions - 1683
                </li>
                <li className="text-xl font-bold">Avenger Robotics - 7451</li>
                <li className="text-xl font-bold">Robo Lions - 1261</li>
                <li className="text-xl font-bold">Phoenix - 4533</li>
              </ul>

              <div className="w-full flex items-center justify-center -translate-y-2">
                <div className="btn btn-primary w-1/3 text-2xl">
                  Live at 4026.org
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
