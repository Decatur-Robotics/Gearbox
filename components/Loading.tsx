import { BsGearFill } from "react-icons/bs"

//npx cloc ./ --exclude-dir=.github,.vscode,certs,node_modules --exclude-ext=json

export default function Loading(props: {}) {
  return <div className="skeleton w-full h-full flex items-center justify-center bg-base-300 ">
    <BsGearFill size={64} className="text-white animate-spin-slow"></BsGearFill>
  </div>
}