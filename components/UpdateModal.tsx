import { useEffect, useRef } from "react";
import Flex from "./Flex";

export const VERSION = "0.5.2";

export function UpdateModal(props: {}) {
	const modalRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const res = localStorage.getItem(`gb-update-${VERSION}`);
		if (modalRef.current && !res) {
			modalRef.current.showModal();
			localStorage.setItem(`gb-update-${VERSION}`, "true");
		}
	});

	return (
		<div className="">
			<dialog
				className="modal shadow-lg bg-transparent "
				ref={modalRef}
			>
				<div className="modal-box">
					<form method="dialog">
						<button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
							✕
						</button>
					</form>
					<News />
				</div>
				<form
					method="dialog"
					className="modal-backdrop"
				>
					<button>close</button>
				</form>
			</dialog>
		</div>
	);
}

function News() {
	return (
		<>
			<Flex center={true}>
				<img
					src="/art/BrokenRobot.svg"
					className="w-1/2"
					alt="Broken Robot"
				></img>
			</Flex>
			<h3 className="font-bold text-lg">Whats New?</h3>
			<p className="py-4">
				We&apos;ve added dozens of improvements to Gearbox, focusing on
				functionality for smaller teams. We also said goodbye to Theo, the
				original developer of this iteration of Gearbox; he will forever live on
				in our hearts and his typos. Before next season, you can look forward to
				a several exciting updates with even more features and improvements.
			</p>
			<div className="divider"></div>
			<p className="font-semibold">
				Changelog: <span className="text-accent">Update #6 (5/26/2024)</span>
			</p>
			<ul className="list-disc w-full text-sm ml-6 mt-2">
				<li>Subjective scouting</li>
				<li>Public data</li>
				<li>Check-in - see who&apos;s currently scouting</li>
				<li>Faster scouter management page</li>
				<li>Scouting without assigning scouters</li>
			</ul>
		</>
	);
}
