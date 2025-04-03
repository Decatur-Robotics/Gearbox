import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { useEffect, useState } from "react";

import ClientApi from "@/lib/api/ClientApi";
import { Team } from "@/lib/Types";
import Container from "@/components/Container";
import Link from "next/link";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import Avatar from "@/components/Avatar";
import { IoCheckmarkCircle, IoMail } from "react-icons/io5";
import Loading from "@/components/Loading";
import { FaCheck, FaPlus } from "react-icons/fa";
import { getDatabase } from "@/lib/MongoDB";
import CollectionId from "@/lib/client/CollectionId";
import { GetServerSideProps } from "next";
import { serializeDatabaseObject } from "@/lib/UrlResolver";
import TeamCard from "@/components/TeamCard";
import { UpdateModal } from "@/components/UpdateModal";
import { Analytics } from "@/lib/client/Analytics";
import { signOut } from "next-auth/react";
import XpProgressBar from "@/components/XpProgressBar";
import { HiPencilAlt } from "react-icons/hi";
import toast from "react-hot-toast";
import EditAvatarModal from "@/components/EditAvatarModal";
import { close } from "fs";

const api = new ClientApi();

export default function Profile(props: { teamList: Team[] }) {
	const { session, status } = useCurrentSession();
	const user = session?.user;
	const teamList = props.teamList;

	const owner = user?.owner ? user?.owner?.length > 0 : false;
	const member = user?.teams ? user.teams?.length > 0 : false;

	const [teams, setTeams] = useState<Team[]>([]);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [loadingRequest, setLoadingRequest] = useState(false);
	const [sentRequest, setSentRequest] = useState(false);

	const [addTeam, setAddTeam] = useState(false);

	const [editingName, setEditingName] = useState(false);
	const [newName, setNewName] = useState<string>();

	const [editingAvatar, setEditingAvatar] = useState(false);

	useEffect(() => {
		const loadTeams = async () => {
			setLoadingTeams(true);
			var newTeams: Team[] = [];
			for (const id in user?.teams) {
				const team = await api.findTeamById(user?.teams[Number(id)]);
				if (team) newTeams.push(team);
			}
			setTeams(newTeams);
			setLoadingTeams(false);
		};

		if (user?.teams) {
			loadTeams();
		}
	}, [session?.user, user?.teams]);

	const requestTeam = async (teamId: string, teamNumber: number) => {
		setLoadingRequest(true);
		await api.requestToJoinTeam(teamId);
		setLoadingRequest(false);
		setSentRequest(true);

		Analytics.requestedToJoinTeam(teamNumber, user?.name ?? "Unknown User");
	};

	async function toggleEditingAvatarModal() {
		setEditingAvatar(!editingAvatar);
	}

	async function toggleEditingName() {
		setEditingName(!editingName);

		if (!editingName) {
			setNewName(user?.name);
			return;
		}

		if (!newName) return;

		console.log("Updating name to", newName, "from", user?.name);
		await api.changeUserName(newName);
		toast.success("Name updated successfully!");
		location.reload();
	}

	return (
		<Container
			requireAuthentication={true}
			hideMenu={false}
			title="Profile"
		>
			{/* <UpdateModal /> */}
			<Flex
				className="my-8 space-y-4"
				center={true}
				mode="col"
			>
				<Card coloredTop="bg-accent">
					<div className="text-2xl flex items-center gap-2">
						{editingName ? (
							<input
								onChange={(e) => setNewName(e.target.value)}
								defaultValue={newName}
								placeholder="New Name"
								className="input"
							/>
						) : (
							<h1>{user?.name}</h1>
						)}
						<button
							data-testid="edit-name-button"
							onClick={toggleEditingName}
							className="btn btn-ghost btn-sm"
						>
							{editingName ? <FaCheck /> : <HiPencilAlt />}
						</button>
					</div>
					<Flex
						mode="row"
						className="space-x-4 max-sm:flex-col max-sm:items-center"
					>
						<div className="flex flex-col">
							<Avatar />
							<button
								onClick={toggleEditingAvatarModal}
								className="btn btn-primary mt-2"
							>
								Edit Avatar
							</button>
							<button
								onClick={() => signOut()}
								className="btn btn-primary mt-2"
							>
								Sign Out
							</button>
						</div>
						<div className="">
							<h1 className="italic text-lg max-sm:text-sm">
								Known as: {user?.slug}
							</h1>
							<h1 className="text-lg max-sm:text-sm">
								<IoMail className="inline text-lg max-sm:text-md" />{" "}
								{user?.email}
							</h1>
							<Flex
								mode="row"
								className="mt-4 space-x-2"
							>
								{member ? (
									<div className="badge badge-md md:badge-lg badge-neutral">
										Member
									</div>
								) : (
									<></>
								)}

								{owner ? (
									<div className="badge badge-md md:badge-lg badge-primary">
										Team Owner
									</div>
								) : (
									<></>
								)}
							</Flex>
							{user != null && (
								<XpProgressBar
									user={user}
									size="4rem"
								/>
							)}
						</div>
					</Flex>
				</Card>

				<Card title="Your Teams">
					<p>Select your current team:</p>
					<div className="divider mt-2" />
					<div className="w-full h-full">
						{loadingTeams ? (
							<Loading></Loading>
						) : (
							<Flex
								mode="col"
								center={true}
								className="space-y-2"
							>
								{teams.map((team) => (
									<Link
										href={"/" + team.slug}
										className="w-full"
										key={team._id.toString()}
									>
										<TeamCard team={team} />
									</Link>
								))}
							</Flex>
						)}

						<Flex
							center={true}
							className="mt-8"
						>
							{!addTeam ? (
								<button
									className="btn btn-circle bg-primary"
									onClick={() => {
										setAddTeam(true);
									}}
								>
									<FaPlus className="text-white"></FaPlus>
								</button>
							) : (
								<Card
									title="Add Team"
									className="bg-base-300 w-full"
								>
									<div className="divider"></div>
									<Flex
										mode="row"
										className="max-sm:flex-col"
									>
										<div className="w-1/2 max-sm:w-full">
											<h1 className="font-semibold text-xl">Join a Team</h1>
											<p className="mb-2">Select your Team</p>
											<div className="w-full h-48 max-sm:h-fit py-2 bg-base-100 rounded-xl md:overflow-y-scroll max-sm:overflow-x-scroll flex flex-col max-sm:flex-row items-center">
												{sentRequest ? (
													<div className="alert alert-success w-full h-full text-white flex flex-col text-xl justify-center">
														<IoCheckmarkCircle size={48}></IoCheckmarkCircle>
														Team Request Sent
													</div>
												) : loadingRequest ? (
													<Loading></Loading>
												) : (
													teamList.map((team) => (
														<div
															className="bg-base-300 w-11/12 rounded-xl p-4 mt-2 border-2 border-base-300 transition ease-in hover:border-primary"
															onClick={() => {
																requestTeam(String(team._id), team.number);
															}}
															key={team._id.toString()}
														>
															<h1 className="max-sm:text-sm h-10">
																{team.tbaId ? "FRC" : "FTC"}{" "}
																<span className="text-primary">
																	{team.number}
																</span>
															</h1>
														</div>
													))
												)}
											</div>
										</div>
										<div className="divider md:divider-horizontal max-sm:divider-vertical"></div>
										<Flex
											mode="col"
											className="w-1/2 items-center space-y-4"
										>
											<img
												src="/art/4026.svg"
												className="w-1/2 h-auto"
												alt="Team 4026"
											></img>
											<Link
												href={"/createTeam"}
												className="btn btn-primary md:btn-wide text-white"
											>
												Create a Team
											</Link>
										</Flex>
									</Flex>
								</Card>
							)}
						</Flex>
					</div>
				</Card>
			</Flex>
			{editingAvatar && (
				<EditAvatarModal
					close={toggleEditingAvatarModal}
					currentImg={user?.image!}
				/>
			)}
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const db = await getDatabase();
	const teams = await db.findObjects(CollectionId.Teams, {});
	const serializedTeams = teams.map((team) => serializeDatabaseObject(team));

	return {
		props: { teamList: serializedTeams },
	};
};
