import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { Competition, Pitreport } from "@/lib/Types";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "react-bootstrap";
import { BsGearFill } from "react-icons/bs";
import { FaRobot } from "react-icons/fa";

export default function PitScoutingCard(props: {
	pitreports: Pitreport[];
	loadingPitreports: boolean;
	comp: Competition | undefined;
}) {
	const { pitreports, loadingPitreports, comp } = props;

	const router = useRouter();

	return (
		<div className="w-full card bg-base-200 shadow-xl h-56">
			{pitreports.length === 0 && !loadingPitreports ? (
				<div className="flex flex-col items-center justify-center h-full">
					<h1 className="text-2xl sm:text-3xl font-bold">
						Pitscouting not available
					</h1>
					<div>
						{comp?.tbaId !== NotLinkedToTba
							? "Could not fetch team list from TBA"
							: "You'll need to manually add teams from Settings"}
					</div>
				</div>
			) : (
				<div className="sm:card-body grow-0">
					<h1 className="max-sm:ml-3 card-title max-sm:pt-2">Pitscouting</h1>
					<div className="overflow-x-scroll flex flex-row space-x-5 h-36 max-sm:ps-1">
						{loadingPitreports ? (
							<div className="w-full flex items-center justify-center">
								<BsGearFill
									className="animate-spin-slow"
									size={75}
								/>
							</div>
						) : (
							pitreports
								?.sort((a, b) => a.teamNumber - b.teamNumber)
								?.map((report) => (
									<Button
										className="card mt-2 bg-base-100 hover:bg-base-200 p-2 h-3/4"
										onClick={() => router.push(`/pit/${report._id}`)}
										key={report._id}
									>
										<div className="relative rounded-t-lg h-6 z-20 w-16 -translate-y-2 font-bold text-center">
											{report.teamNumber}
										</div>
										<div className="absolute rounded z-10 translate-y-4 flex justify-center items-center">
											{report.submitted ? (
												<img
													alt={`Team ${report.teamNumber}'s robot`}
													src={report.data?.image}
													loading="lazy"
													style={{ imageResolution: "72dpi" }}
													className="w-2/3 h-auto rounded-lg"
												></img>
											) : (
												<FaRobot size={64} />
											)}
										</div>
									</Button>
								))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
