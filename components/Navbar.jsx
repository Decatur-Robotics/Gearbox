
import Image from "next/image";
import Link from "next/link";
import {BsGearFill} from "react-icons/bs"

export default function Navbar(props) {
    const status = props.status;
    const user = props?.user;
    let authenticated = status === "authenticated";

    return <div className="w-full h-20 flex flex-row justify-center border-b-4 border-gray-300 pb-2">
      
     
      <div className="w-1/5 h-full flex flex-row items-center justify-center">
          <BsGearFill className="text-5xl mr-1"/>
          <h1 className="mb-1 text-5xl font-mono">Gearbox</h1>
      </div>

      
      <div className="w-3/5 h-full flex flex-row items-center space-x-8 text-xl font-semibold">

        <div className="w-1 h-2/3 bg-gray-300"></div>

        <h1>Who We Are</h1>
        <h1>About</h1>
        <h1>Contact</h1>
      </div>

      <div className="w-1/5 h-full flex flex-row items-center">
        <div className="w-1 h-2/3 bg-gray-300"></div>
        {
          authenticated ? <Link className="w-full h-full flex flex-row items-center justify-center space-x-6" href={"/profile"}>
            <h1 className="text-lg font-bold">{user?.name}</h1>
            <Image src={user?.image} width={128} height={128} className="w-1/5 h-fit rounded-full border-4 border-gray-400"></Image>
          </Link> : <Link href={"/api/auth/signin"} className="w-full h-full flex flex-row items-center justify-center"><div className="w-2/3 h-2/3 bg-blue-400 rounded-lg flex items-center justify-center text-xl text-white font-bold">Login</div></Link>
        }
      </div>
    </div>
}