import { BsGearFill } from "react-icons/bs";
import Pamphlet from "../components/Pamphlet";
import QrCode from "@/components/QrCode";

export default function QrPamphlet() {
	return (
		<Pamphlet>
			<div className="px-4 py-2">
				<h1 className="font-bold text-7xl">
					<BsGearFill className="inline" /> Gearbox{" "}
					<span className="text-3xl relative bottom-2 bg-accent px-4 p-3 rounded-full text-white">
						BETA
					</span>
				</h1>
				<p className="text-3xl font-mono ml-20 relative bottom-2">
					By <span className="text-accent relative">Decatur Robotics 4026</span>
				</p>
				<div className="flex flex-row w-full">
					<div className="flex flex-col w-1/2">
						<ul className="text-3xl list-disc pl-5 space-y-1">
							<li>Easy scouting for FTC & FRC</li>
							<li>Pre-made scouting forms</li>
							<li>Set up in under 5 minutes</li>
							<li>Powerful data analytics</li>
							<li>Works on any device</li>
							<li>Optionally share your data</li>
						</ul>
					</div>
					<div className="flex flex-col justify-center w-3/5">
						<QrCode value="https://4026.org" />
						<div className="ml-5 btn btn-primary w-2/3 text-3xl">
							Live at 4026.org
						</div>
					</div>
				</div>
			</div>
		</Pamphlet>
	);
}
