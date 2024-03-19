import { Report } from "@/lib/Types";
import { NumericalAverage, MostCommonValue } from "@/lib/client/StatsMath";

export default function Summary(props: { selectedReports: Report[] }) {
  if (!props.selectedReports) {
    return <code></code>;
  }

  const avgX = NumericalAverage("AutoStartX", props.selectedReports);
  const avgA = NumericalAverage("AutoStartAngle", props.selectedReports);
  const intake = MostCommonValue("IntakeType", props.selectedReports);
  const matches = props.selectedReports.length;
  const startingSide = avgX < 350 / 2 ? "left" : "right";
  const startingAngle = avgA < 180 ? "low" : "high";

  return (
    <code className=" w-full h-full mx-auto text-sm font-semibold ">
      <h1 className="text-xl">Insights</h1>
      Analysis suggests that this robot favors starting{" "}
      <span className="text-accent">{startingSide}</span> on the field, at{" "}
      <span className="text-accent">{startingAngle}</span> angles of attack.
      Outfitted with a{" "}
      <span className="text-accent">
        {intake.charAt(0).toLowerCase() + intake.slice(1, intake.length)}
      </span>{" "}
      intake, this robot is a <span className="text-accent">high</span> auto
      performer.
      {matches < 5 ? (
        <span className="text-warning">
          {" "}
          <br />
          <br /> However, this robot has only competed in{" "}
          <span className="text-accent">{matches}</span> matches
        </span>
      ) : (
        <>
          This robot has competed in many matches and is very well characterized
        </>
      )}
    </code>
  );
}
