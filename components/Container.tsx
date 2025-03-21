import { CompetitonNameIdPair, Season, Team } from "@/lib/Types";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { BiMenu, BiPlus, BiHome, BiSolidPhone } from "react-icons/bi";
import { IoSunny, IoMoon, IoCloudOffline } from "react-icons/io5";
import { BsGearFill } from "react-icons/bs";
import ClientApi from "@/lib/api/ClientApi";
import Footer from "./Footer";
import { FaDiscord, FaSearch } from "react-icons/fa";
import useCheckMobile from "@/lib/client/useCheckMobile";
import {
	MdInfo,
	MdOfflineBolt,
	MdOfflinePin,
	MdOfflineShare,
	MdWarning,
} from "react-icons/md";
import { RiWifiOffLine } from "react-icons/ri";
import Avatar from "./Avatar";
import Banner, { DiscordBanner } from "./Banner";
import { stat } from "fs";
import { forceOfflineMode } from "@/lib/client/ClientUtils";
import Head from "next/head";
import SignInMenu from "./SignInMenu";

const api = new ClientApi();

type ContainerProps = {
	children: ReactNode;
	requireAuthentication: boolean;
	title: string;
	/**
	 * Hides the button to open the sidebar.
	 */
	hideMenu?: boolean;
	notForMobile?: boolean | undefined;
};

export default function Container(props: ContainerProps) {
	const { session, status } = useCurrentSession();
	const user = session?.user;
	const authenticated = !forceOfflineMode() && status === "authenticated";

	const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
	const [accepted, setAccepted] = useState(false);
	const onMobile = useCheckMobile();
	const [teams, setTeams] = useState<Team[]>([]);

	const [selectedTeamIndex, setSelectedTeamIndex] = useState<number>(0);
	const selectedTeam = teams[selectedTeamIndex];
	const [loadingSeasons, setLoadingSeasons] = useState<boolean>(false);
	const [selectedTeamSeasons, setSelectedTeamSeasons] = useState<Season[]>([]);

	const [eventSearch, setEventSearch] = useState<string>("");
	const [eventResults, setEventResults] = useState<
		{ value: number; pair: CompetitonNameIdPair }[]
	>([]);

	const tLocal =
		typeof window !== "undefined"
			? window.localStorage.getItem("theme")
			: "dark";
	const [theme, setTheme] = useState<string>(tLocal ? tLocal : "dark");

	useEffect(() => {
		async function search() {
			if (eventSearch === "") {
				setEventResults([]);
				return;
			}
			setEventResults(await api.searchCompetitionByName(eventSearch));
		}
		search();
	}, [eventSearch]);

	useEffect(() => {
		const loadTeams = async () => {
			if (!user) {
				return;
			}

			setLoadingTeams(true);
			let newTeams: Team[] = [];
			for (const team of user.teams) {
				const foundTeam = await api.findTeamById(team).catch(() => undefined);
				if (!foundTeam) continue;
				newTeams.push(foundTeam);
			}
			setTeams(newTeams);

			setLoadingTeams(false);
		};

		loadTeams();
	}, [user]);

	useEffect(() => {
		const loadSelectedSeasons = async () => {
			if (!selectedTeam) {
				return;
			}
			setLoadingSeasons(true);

			let newSeasons: Season[] = [];

			if (!selectedTeam?.seasons) {
				setLoadingSeasons(false);
				return;
			}

			for (const season of selectedTeam?.seasons) {
				const seasonObj = await api
					.findSeasonById(season)
					.catch(() => undefined);
				if (seasonObj) newSeasons.push(seasonObj);
			}

			setSelectedTeamSeasons(newSeasons);
			setLoadingSeasons(false);
		};

		loadSelectedSeasons();
	}, [selectedTeamIndex, teams, selectedTeam]);

	let showAuthBlock = false;
	if (props.requireAuthentication) {
		showAuthBlock = true;
		if (status === "authenticated") {
			showAuthBlock = false;
		}
	}

	return (
		<div
			className="w-full h-screen flex flex-col overflow-x-hidden"
			data-theme={theme}
		>
			<Head>
				<title>
					{props.title !== "Gearbox" ? `${props.title} | Gearbox` : props.title}
				</title>
			</Head>

			<DiscordBanner />

			<div className="drawer">
				<input
					id="menu"
					type="checkbox"
					className="drawer-toggle"
				/>
				<div className="drawer-content">
					<div className=" sm:w-full h-16 bg-base-200 flex flex-row items-center justify-between sticky top-0 z-10">
						<div className="flex flex-row items-center sm:justify-center">
							{authenticated && !(props.hideMenu ?? false) ? (
								<label
									htmlFor="menu"
									className="btn btn-ghost drawer-button"
								>
									<BiMenu className="text-3xl" />
								</label>
							) : (
								<></>
							)}
							<Link
								href={"/"}
								className="max-sm:hidden"
							>
								<h1 className="text-3xl mb-1 btn btn-ghost">
									<BsGearFill className="hover:animate-spin"></BsGearFill>
									Gearbox{" "}
									<span className="text-xl bg-accent px-3 p-2 rounded-full text-white">
										BETA
									</span>
								</h1>
							</Link>
						</div>

						<label className="input input-bordered flex items-center sm:gap-2 w-1/2 max-sm:w-1/2">
							<input
								type="text"
								value={eventSearch}
								onChange={(e) => {
									setEventSearch(e.target.value);
								}}
								className="grow bg-base-100"
								placeholder="Search an event"
							/>
							<FaSearch />
							{eventResults.length > 0 ? (
								<div className="absolute -translate-x-5 translate-y-20 sm:translate-y-24 w-1/2 sm:w-1/4 bg-base-300 rounded-b-lg sm:p-2">
									<ul>
										{eventResults.map((result) => (
											<li key={result.pair.name}>
												<a
													className="link"
													href={"/event/" + result.pair.tbaId}
												>
													{result.pair.name}
												</a>
											</li>
										))}
									</ul>
								</div>
							) : (
								<></>
							)}
						</label>

						<div>
							{authenticated ? (
								<Link
									href={"/profile"}
									tabIndex={0}
									className="mr-3 sm:mr-5"
								>
									<Avatar
										user={user!}
										className="translate-y-1"
										scale="w-11"
										imgHeightOverride="h-11"
										showLevel={false}
										borderThickness={2}
										gearSize={24}
									/>
								</Link>
							) : (
								<a
									href={"/signin"}
									rel="noopener noreferrer"
									target="_blank"
								>
									<button className="btn btn-primary sm:mr-4">Sign In</button>
								</a>
							)}

							{/*
              <label className="max-sm:hidden swap swap-rotate sm:mr-10">
                <input
                  type="checkbox"
                  className="theme-controller"
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                />

                <IoSunny className="swap-on sm:w-10 h-10 "></IoSunny>

                <IoMoon className="swap-off sm:w-10 h-10"></IoMoon>
              </label>
                */}
						</div>
					</div>

					{showAuthBlock ? (
						<SignInMenu />
					) : (
						<>
							{props.notForMobile && !accepted && onMobile ? (
								<div className="w-full h-full flex flex-col items-center justify-center">
									<div className="card w-3/4 lg:w-1/4 bg-base-200 text-primary-content">
										<div className="card-body flex items-center text-white">
											<BiSolidPhone size={45}></BiSolidPhone>
											<h2 className="card-title">Warning</h2>
											<div className="divider"></div>
											<p>This page is not mobile friendly</p>
											<p className="text-sm">
												For the best experience, a computer is recommended
											</p>
											<div className="card-actions justify-end">
												<button
													className="btn btn-primary"
													onClick={() => {
														setAccepted(true);
													}}
												>
													Ok
												</button>
											</div>
										</div>
									</div>
								</div>
							) : (
								<>
									{props.children} <Footer></Footer>
								</>
							)}
						</>
					)}
				</div>
				<div className="drawer-side z-20">
					<label
						htmlFor="menu"
						className="drawer-overlay"
					></label>
					<div className="w-64 bg-base-300 h-full">
						<div className="h-full flex flex-row">
							<div className="w-1/3 h-full flex flex-col items-center space-y-6 bg-base-100">
								<h1 className="mt-4 font-semibold">Teams: </h1>

								{loadingTeams ? (
									<span className="loading loading-spinner loading-lg"></span>
								) : (
									<></>
								)}

								{teams.map((team, index) => {
									var initials =
										team.name
											?.split(" ")
											?.map((section) => section.charAt(0)) ?? "?";
									var selected = index === selectedTeamIndex;
									return (
										<button
											className={
												"w-16 h-16 btn btn-ghost " +
												(selected ? "border-2 border-accent" : "border-2")
											}
											key={team._id.toString()}
											onClick={() => {
												setSelectedTeamIndex(index);
											}}
										>
											<h1 className="text-2xl">{initials}</h1>
										</button>
									);
								})}

								<Link
									className="w-16 h-16 btn btn-primary"
									href={"/createTeam"}
								>
									<BiPlus className="text-4xl"></BiPlus>
								</Link>
							</div>

							<div className="w-2/3 h-full bg-base-300 flex flex-col items-center">
								<h1 className="font-semibold text-lg mt-10">
									{selectedTeam?.name}
								</h1>

								<Link href={`/${selectedTeam?.slug}`}>
									<button className="btn btn-ghost normal-case bg-base-100">
										<BiHome className="text-2xl"></BiHome>
										{selectedTeam?.alliance ? "Alliance Home" : "Team Home"}
									</button>
								</Link>

								<h1 className="mt-10">Seasons:</h1>

								{loadingSeasons ? (
									<span className="loading loading-spinner loading-lg"></span>
								) : (
									<></>
								)}

								{selectedTeamSeasons.map((season, index) => {
									return (
										<Link
											className="btn btn-ghost w-7/8 bg-base-200 normal-case mb-2"
											href={`/${selectedTeam?.slug}/${season?.slug}`}
											key={season._id}
										>
											<h1 className="text-sm">
												{season.name} - {season.year}
											</h1>
										</Link>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
