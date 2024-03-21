import { BsGearFill } from "react-icons/bs";

export default function Pamphlet() {
  return (
    <div>
    <div className="h-[5.5in] w-[8.5in] bg-base-200">
      <div className="card w-full h-full">
        <div className="px-4 py-2">
          <h1 className="font-bold text-7xl"><BsGearFill className="inline" /> Gearbox <span className="text-3xl relative bottom-2 bg-accent px-4 p-3 rounded-full text-white">
                    BETA
                  </span></h1>
          <p className="text-3xl font-mono ml-20 relative bottom-2">By <span className="text-accent relative">Decatur Robotics 4026</span> </p>
          
          <div className="relative -translate-y-4">
          <div className="divider"></div>
          <p className="text-2xl font-semibold bg-base-100 p-4 rounded-xl -translate-y-2">Gearbox is a powerful plug-and-play scouting tool that automatically
            handles match creation, scouter assignment, and data visualization</p>
          <h1 className="text-2xl font-bold mt-6 -translate-y-7">Features: </h1>
          <ul className=" list-disc ml-12 font-mono -translate-y-7">
            <li className="text-xl">Automatic Match Creation</li>
            <li className="text-xl">Detailed Pit-scouting with images</li>
            <li className="text-xl">Advanced Statistic Engine</li>
          </ul>
          <h1 className="ml-64 font-mono -translate-y-4">plus picklists, live-updates, match reports and more!</h1>
          <div className="w-full flex items-center justify-center mt-4">
            <div className="btn btn-primary w-1/2 text-3xl -translate-y-3">Live at 4026.org</div>
          </div>
          </div>
          
         
        </div>
      </div>
    </div>

    <div className="h-[5.5in] w-[8.5in] bg-base-200">
      <div className="card w-full h-full">
        <div className="px-4 py-2">
          <h1 className="font-bold text-7xl"><BsGearFill className="inline" /> Gearbox <span className="text-3xl relative bottom-2 bg-accent px-4 p-3 rounded-full text-white">
                    BETA
                  </span></h1>
          <p className="text-3xl font-mono ml-20 relative bottom-2">By <span className="text-accent relative">Decatur Robotics 4026</span> </p>
          
          <div className="relative -translate-y-4">
          <div className="divider"></div>
          <p className="text-2xl font-semibold bg-base-100 p-4 rounded-xl -translate-y-2">Gearbox is a powerful plug-and-play scouting tool that automatically
            handles match creation, scouter assignment, and data visualization</p>
          <h1 className="text-2xl font-bold mt-6 -translate-y-7">Features: </h1>
          <ul className=" list-disc ml-12 font-mono -translate-y-7">
            <li className="text-xl">Automatic Match Creation</li>
            <li className="text-xl">Detailed Pit-scouting with images</li>
            <li className="text-xl">Advanced Statistic Engine</li>
          </ul>
          <h1 className="ml-64 font-mono -translate-y-4">plus picklists, live-updates, match reports and more!</h1>
          <div className="w-full flex items-center justify-center mt-4">
            <div className="btn btn-primary w-1/2 text-3xl -translate-y-3">Live at 4026.org</div>
          </div>
          </div>
          
         
        </div>
      </div>
    </div>


    </div>
    
  );
}