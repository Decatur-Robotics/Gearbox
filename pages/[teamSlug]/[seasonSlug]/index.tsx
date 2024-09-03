import ClientAPI from "@/lib/client/ClientAPI";
import UrlResolver, { SerializeDatabaseObjects } from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { Competition, Season, Team } from "@/lib/Types";
import Container from "@/components/Container";
import Link from "next/link";
import { useCurrentSession } from "@/lib/client/hooks/useCurrentSession";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { getDatabase } from "@/lib/MongoDB";
import CompetitionCard from "@/components/CompetitionCard";
import Loading from "@/components/Loading";
import { FaPlus } from "react-icons/fa";
import { ObjectId } from "bson";
import Collections from "@/lib/client/CollectionId";

const api = new ClientAPI("gearboxiscool");

type SeasonPageProps = {
  team: Team;
  season: Season;
  competitions: Competition[];
};

export default function Home(props: SeasonPageProps) {
  const { session, status } = useCurrentSession();
  const team = props.team;
  const season = props.season;
  const comp = props.competitions;
  const owner = session?.user && team?.owners.includes(session.user._id);

  return (
    <Container requireAuthentication={true} hideMenu={false} title={season.name}>
      <Flex mode="col" className="space-y-4 py-20 min-h-screen items-center">
        <Card title={season.name} coloredTop="bg-primary">
          <h1 className="font-semibold text-lg">
            The <span className="text-accent">{season.year}</span> Season
          </h1>
          <div className="divider"></div>
        </Card>

        <Card title={"Season Overview"}>
          <h1 className="font-semibold text-lg">Select a Competition</h1>
          {comp?.length === 0 || !comp ? (
            <div className="w-full h-32">
              <Loading></Loading>
            </div>
          ) : (
            <></>
          )}
          {comp?.map((comp) => (
            <Link
              key={comp._id.toString()}
              href={`/${team.slug}/${season.slug}/${comp.slug}`}
            >
              <CompetitionCard comp={comp}></CompetitionCard>
            </Link>
          ))}
          {owner ? (
            <Flex center={true} className="mt-4">
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
  const resolved = await UrlResolver(context);
  const team = resolved.team;
  const season = resolved.season;

  const comp = await db.findObjects(Collections.Competitions, {
    _id: { $in: season?.competitions?.map((id) => new ObjectId(id)) },
  });

  return {
    props: {
      team: team,
      season: season,
      competitions: SerializeDatabaseObjects(comp),
    },
  };
};
