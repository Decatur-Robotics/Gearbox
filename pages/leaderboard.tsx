import Avatar from "@/components/Avatar";
import Card from "@/components/Card";
import Container from "@/components/Container";
import ClientApi from "@/lib/api/ClientApi";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { LeaderboardTeam, LeaderboardUser } from "@/lib/Types";
import { useEffect, useState } from "react";

const api = new ClientApi();

export default function Leaderboard() {
	const { session } = useCurrentSession();

	const [usersOrTeam, setUsersOrTeam] = useState<"users" | "teams">("users");

	const [userLeaderboard, setUserLeaderboard] = useState<LeaderboardUser[]>();
	const [teamLeaderboard, setTeamLeaderboard] = useState<LeaderboardTeam[]>();

	useEffect(() => {
		api.getLeaderboard().then(({ users, teams }) => {
			setUserLeaderboard(users);
			setTeamLeaderboard(teams);
		});
	}, []);

	return (
		<Container
			requireAuthentication={false}
			title={"Scouting Leaderboard"}
		>
			<Card
				title="Leaderboard"
				coloredTop="bg-accent"
				className="w-full m-6"
			>
				Here is every user/team ranked by their level and XP:
				<div className="w-full">
					<button
						className={`w-1/2 btn btn-sm btn-${usersOrTeam == "users" ? "primary" : "ghost"}`}
						onClick={() => setUsersOrTeam("users")}
					>
						Users
					</button>
					<button
						className={`w-1/2 btn btn-sm btn-${usersOrTeam == "teams" ? "primary" : "ghost"}`}
						onClick={() => setUsersOrTeam("teams")}
					>
						Teams
					</button>
					<table className="table">
						<thead>
							<tr>
								<th>Rank</th>
								<th>{usersOrTeam == "users" ? "User" : "Team"} </th>
								{usersOrTeam == "users" && (
									<>
										<th>Teams</th>
										<th>Level</th>
									</>
								)}
								<th>XP</th>
							</tr>
						</thead>
						{usersOrTeam == "users" &&
							userLeaderboard &&
							userLeaderboard.map((user, index) => (
								<tr
									key={user._id}
									className={`${session?.user?._id == user._id && "text-primary"} hover:bg-base-100 h-min`}
								>
									<td>{index + 1}</td>
									<td className="flex flex-row items-center h-min">
										<Avatar
											user={user}
											showLevel={false}
											scale="w-11"
											imgHeightOverride="h-11"
											borderThickness={2}
											className="mr-2"
										/>
										<div>
											{user.name}{" "}
											{session?.user?._id == user._id ? "(You)" : ""}
										</div>
									</td>
									<td>{user.teams.join(", ")}</td>
									<td>{user.level}</td>
									<td>{user.xp}</td>
								</tr>
							))}
						{usersOrTeam == "teams" &&
							teamLeaderboard &&
							teamLeaderboard.map((team, index) => (
								<tr
									key={team._id}
									className={`${session?.user?.teams.includes(team._id) && "text-primary"} hover:bg-base-100`}
								>
									<td>{index + 1}</td>
									<td>
										{team.name}{" "}
										{session?.user?.teams.includes(team._id)
											? "(Your Team)"
											: ""}
									</td>
									<td>{team.xp}</td>
								</tr>
							))}
					</table>
				</div>
			</Card>
		</Container>
	);
}
