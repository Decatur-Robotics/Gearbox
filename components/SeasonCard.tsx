import { Season, Team } from "@/lib/Types";
import Card from "./Card";

export default function SeasonCard(props: { season: Season | undefined }) {
  const season = props.season;
  return (
    <Card
      title={season?.name}
      key={season?._id.toString()}
      className="w-full bg-base-300 border-4 border-base-300 transition ease-in hover:border-primary"
    >
      <h1 className="font-semibold">
        The <span className="text-accent">{season?.year}</span> Season
      </h1>
    </Card>
  );
}
