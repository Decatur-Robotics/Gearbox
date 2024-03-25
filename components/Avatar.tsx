import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { levelToClassName } from "@/lib/Xp";
import { BsGearFill } from "react-icons/bs";

export default function Avatar(props: {}) {
  const { session, status } = useCurrentSession();
  const user = session?.user;
  const image = user?.image ?? "/user.jpg";
  const levelClass = levelToClassName(10);
  const admin = user?.admin;

  return (
    <div className={"avatar "}>
      <div className="absolute z-10 bg-base-100 rounded-tl-xl rounded-br-xl h-6 w-14 text-center text-sm font-semibold">
        LVL: {user?.level}
      </div>
      <div className={`w-28 h-28 rounded-xl border-4 ${levelClass}`}>
        <img src={image}></img>
      </div>
      {admin ? (
        <div className="absolute z-10 -bottom-2 -left-2 text-slate-300 animate-spin-slow">
          <BsGearFill size={36}></BsGearFill>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
