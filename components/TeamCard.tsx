import { Team } from "@/lib/Types";
import Card from "./Card";

export default function TeamCard(props: { team: Team | undefined }) {
  const team = props.team;
  return (
    <Card
      title={team?.name}
      key={team?._id.toString()}
      className="w-full bg-base-300 border-4 border-base-300 transition ease-in hover:border-primary"
    >
      <h1 className="font-semibold max-sm:text-sm">
        {team?.league} Team <span className="text-accent">{team?.number}</span> -{" "}
        <span className="text-primary">{team?.users.length}</span> members
      </h1>
    </Card>
  );
}
