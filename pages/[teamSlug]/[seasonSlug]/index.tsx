import ClientApi from "@/lib/api/ClientApi";
import UrlResolver, { serializeDatabaseObjects } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { Competition, Season, Team } from "@/lib/Types";
import Container from "@/components/Container";
import Link from "next/link";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { getDatabase } from "@/lib/MongoDB";
import CollectionId from "@/lib/client/CollectionId";
import CompetitionCard from "@/components/CompetitionCard";
import Loading from "@/components/Loading";
import { FaPlus, FaTrash } from "react-icons/fa";
import { ObjectId } from "bson";
import toast from "react-hot-toast";

const api = new ClientApi();

type SeasonPageProps = {
	team: Team;
	season: Season;
	competitions: Competition[];
};

export default function Home(props: SeasonPageProps) {
	const { session, status } = useCurrentSession();
	const team = props.team;
	const season = props.season;
	const comps = props.competitions;
	const owner = team?.owners.includes(session?.user?._id as string);

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
							className="w-1/6 sm:1/8 h-1/4 btn btn-sm btn-error flex"
						>
							<FaTrash />
							<p className="max-sm:hidden md:visible">
								Delete
								<br className="max-sm:hidden" /> Season
							</p>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
	const db = await getDatabase();
	const resolved = await UrlResolver(context, 2);
	if ("redirect" in resolved) {
		return resolved;
	}

	const team = resolved.team;
	const season = resolved.season;

	const comp = await db.findObjects(CollectionId.Competitions, {
		_id: { $in: season?.competitions.map((id) => new ObjectId(id)) },
	});

	return {
		props: {
			team: team,
			season: season,
			competitions: serializeDatabaseObjects(comp),
		},
	};
};
