import { Season, Team } from "../../lib/Types";
import ClientAPI from "../../lib/client/ClientAPI";
import UrlResolver, {
  SerializeDatabaseObjects,
} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import Container from "@/components/Container";
import { Collections, getDatabase } from "@/lib/MongoDB";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import { FaPlus } from "react-icons/fa";
import { GameId } from "@/lib/client/GameId";
import { games } from "@/lib/games";

const api = new ClientAPI("gearboxiscool");

type CreateSeasonProps = { team: Team; existingSeasons: Season[] };

export default function CreateSeason(props: CreateSeasonProps) {
  const team = props.team;

  const createSeason = async (gameId: GameId) => {
    const game = games[gameId];

    const s = await api.createSeason(
      game.name,
      game.year,
      gameId,
      team?._id as string
    );
    const win: Window = window;
    win.location = `/${team?.slug}/${s.slug}`;
  };

  const gamesWithIds = Object.entries(games).map(([id, game]) => {
    return { ...game, id: id as GameId };
  });

  return (
    <Container requireAuthentication={true} hideMenu={false} title="Create Season">
      <Flex mode="row" center={true} className="h-fit py-12 md:py-24">
        <div className="w-2/3 max-sm:w-11/12 flex flex-row max-sm:flex-col max-sm:space-y-4 md:space-x-4">
          {
            gamesWithIds.map(game => <Card key={game.id} title={game.name} className="w-1/3 bg-base-300">
              <h1 className="text-lg font-semibold">
                {game.year} {game.league} season
              </h1>
              <img
                className="w-fit h-auto"
                src={game.coverImage}
              ></img>
              <button
                className="btn btn-primary"
                onClick={() => {
                  createSeason(game.id);
                }}
              >
                <FaPlus></FaPlus>Create
              </button>
            </Card>)
          }
        </div>
      </Flex>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = await getDatabase();
  const resolved = await UrlResolver(context);
  const existingSeasons = await db.findObjects(Collections.Seasons, {
    _id: { $in: resolved.team?.seasons },
  });
  return {
    props: {
      team: resolved.team,
      existingSeasons: SerializeDatabaseObjects(existingSeasons),
    },
  };
};
