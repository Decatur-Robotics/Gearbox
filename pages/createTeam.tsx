import { League, Team } from "@/lib/Types";
import { useEffect, useState } from "react";

import { useCurrentSession } from "@/lib/client/useCurrentSession";

import ClientApi from "@/lib/api/ClientApi";
import Container from "@/components/Container";
import Card from "@/components/Card";
import Flex from "@/components/Flex";
import { Analytics } from "@/lib/client/Analytics";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";

const api = new ClientApi();

export default function CreateTeam() {
	const { session, status } = useCurrentSession();

	const [team, setTeam] = useState<Partial<Team>>({});
	const [error, setError] = useState("");

	const createTeam = async () => {
		if (!session?.user) {
			return;
		}

		if (!team?.league) {
			setError("Must select a league");
			return;
		}

		if (team.alliance) {
			//If this ever becomes an issue it might work better to convert the number to a string and check the length - Davis.
			if (!team.number || team.number < 10000) {
				setError("Alliance numbers must be greater than six digits");
				return;
			}
		}

		if (!team?.number) {
			setError("Must enter a team number");
			return;
		}

		if (!team?.name) {
			setError("Must enter a team name");
			return;
		}

		const findResult = await api.findTeamByNumberAndLeague(
			Number(team?.number),
			team.league,
		);
		if (findResult?._id) {
			setError("This Team Already Exists");
			return;
		}

		const newTeam = await api.createTeam(
			team.name,
			team.tbaId ?? NotLinkedToTba,
			team.number,
			team.league,
			team.alliance == true,
		);

		if (!newTeam) {
			setError("Failed to create team. Please try again later.");
			return;
		}

		Analytics.teamCreated(
			team.number,
			team.league,
			session?.user?.name ?? "Unknown User",
		);

		const win: Window = window;
		win.location = `/${newTeam.slug}`;
	};

	useEffect(() => {
		api
			.getTeamAutofillData(team.number!, team.league ?? League.FRC)
			.catch(() => null)
			.then((data) => {
				if (data) setTeam((team) => ({ ...team, name: data.name }));
				setError("");
			});
	}, [team.number, team.league]);

	return (
		<Container
			requireAuthentication={true}
			hideMenu={false}
			title="Create Team"
		>
			<Flex
				mode="col"
				className="md:h-full items-center md:justify-center max-sm:py-10"
			>
				<Card title={team.alliance ? "Create an Alliance" : "Create a Team"}>
					<label className="cursor-pointer label">
						<span className="label-text">Creating a Scouting Alliance (allows multiple teams to scout together)</span>
						<input
							type="checkbox"
							className="checkbox checkbox-accent"
							onChange={() => {
								setTeam({ ...team, alliance: !team.alliance });
							}}
						/>
					</label>
					<div className="flex flex-row space-x-4 flex-g">
						{Object.values(League).map((league) => (
							<button
								key={league}
								className={`w-1/2 btn bg-base-300 border-accent ${team.league === league && " border-4"}`}
								onClick={() => setTeam({ ...team, league })}
							>
								{league}
							</button>
						))}
					</div>
					{/* Use value={team.number ?? ""} to start the input as controlled while still showing the placeholder -Renato */}
					<input
						type="number"
						placeholder={
							team.alliance
								? "Alliance Number (Six Digits or More)"
								: "Team Number"
						}
						className="input w-full"
						value={team.number ?? ""}
						onChange={(e) =>
							setTeam({
								...team,
								number: +e.target.value > 0 ? +e.target.value : undefined,
							})
						}
					/>
					<input
						type="text"
						placeholder={team.alliance ? "Alliance Name" : "Team Name"}
						className="input w-full"
						value={team.name ?? ""}
						onChange={(e) => setTeam({ ...team, name: e.target.value })}
					/>

					<button
						className="btn btn-primary w-full"
						onClick={createTeam}
					>
						Create Team
					</button>
					{error && <p className="text-red-500">{error}</p>}
				</Card>
			</Flex>
		</Container>
	);
}
