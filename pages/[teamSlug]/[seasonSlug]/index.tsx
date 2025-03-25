import ClientApi from "@/lib/api/ClientApi";
import UrlResolver, { serializeDatabaseObjects } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { Competition, Season, Team } from "@/lib/Types";
import Container from "@/components/Container";
import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import CompetitionCard from "@/components/CompetitionCard";
import Loading from "@/components/Loading";
import { FaPlus, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const api = new ClientApi();

export default function Home() {
	const { session, status } = useCurrentSession();
	const router = useRouter();

	const [team, setTeam] = useState<Team>();
	const [season, setSeason] = useState<Season>();
	const [comps, setComps] = useState<Competition[]>();

	const owner = team?.owners.includes(session?.user?._id as string);

	useEffect(() => {
		// Find the team, season, and competitions

		const { seasonSlug } = router.query;
		if (!seasonSlug) return;

		api.getSeasonPageData(seasonSlug as string).then((data) => {
			if (!data) {
				toast.error("Season not found.");
				return;
			}

			const { team, season, comps } = data;
			setTeam(team);
			setSeason(season);
			setComps(comps);
		});
	}, [router.query.seasonSlug]);

	function deleteSeason() {
		if (!season?._id) return;

		const confirmKey = `delete-season-${season.slug}`;
		if (
			prompt(
				`If you are sure you want to IRREVOCABLY delete this season and all data associated with it, including competitions, type "${confirmKey}"`,
			) === confirmKey
		) {
			toast.promise(
				api.deleteSeason(season._id).finally(() => {
					window.location.href = `/${team?.slug}`;
				}),
				{
					loading: "Deleting season...",
					success: "Season deleted successfully!",
					error: "Error deleting season.",
				},
			);
		} else toast.error("Season not deleted.");
	}

	if (!team || !season || !comps) {
		return (
			<Container
				requireAuthentication={true}
				hideMenu={false}
				title={`Loading ${router.query.seasonSlug}`}
			>
				<Flex
					mode="col"
					className="space-y-4 py-20 min-h-screen items-center"
				>
					<Card title={`Loading ${router.query.seasonSlug}...`}>
						<Loading />
					</Card>
				</Flex>
			</Container>
		);
	}

	return (
		<Container
			requireAuthentication={true}
			hideMenu={false}
			title={season.name}
		>
			<Flex
				mode="col"
				className="space-y-4 py-20 min-h-screen items-center"
			>
				<Card
					title={season.name}
					coloredTop="bg-primary"
				>
					<h1 className="font-semibold text-lg">
						The <span className="text-accent">{season.year}</span> Season
					</h1>
					{owner && (
						<button
							onClick={deleteSeason}
							className="w-1/6 btn btn-sm btn-error flex items-center"
						>
							<FaTrash />
							Delete Season
						</button>
					)}
					<div className="divider" />
				</Card>

				<Card title={"Season Overview"}>
					<h1 className="font-semibold text-lg">Select a Competition</h1>
					{!comps ? (
						<div className="w-full h-32">
							<Loading />
						</div>
					) : comps.length === 0 ? (
						<p>No competitions have been created yet.</p>
					) : (
						<></>
					)}
					{comps.map((comp) => (
						<Link
							key={comp._id}
							href={`/${team.slug}/${season.slug}/${comp.slug}`}
						>
							<CompetitionCard comp={comp}></CompetitionCard>
						</Link>
					))}
					{owner ? (
						<Flex
							center={true}
							className="mt-4"
						>
							<Link href={`/${team.slug}/${season.slug}/createComp`}>
								<button className="btn btn-circle bg-primary">
									<FaPlus className="text-white"></FaPlus>
								</button>
							</Link>
						</Flex>
					) : (
						<></>
					)}
				</Card>
			</Flex>
		</Container>
	);
}
