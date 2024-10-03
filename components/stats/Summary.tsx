import { Report } from "@/lib/Types";
import { NumericalAverage, MostCommonValue } from "@/lib/client/StatsMath";
import { Dot } from "./Heatmap";

export default function Summary(props: { selectedReports: Report[], dots: Dot[] }) {
  if (!props.selectedReports) {
    return (
    <code>
      <div>
        {
          props.dots.map((dot, index) => (
            <div key={index} className="badge badge-sm badge-primary w-full">{dot.label}</div>
          ))
        }
      </div>
    </code>);
  }

  const avgX = NumericalAverage((r) => r.AutoStart?.x ?? 0, props.selectedReports);
  const avgA = NumericalAverage((r) => r.AutoStart?.y ?? 0, props.selectedReports);
  const matches = props.selectedReports.length;
  const startingSide = avgX < 350 / 2 ? "left" : "right";
  const startingAngle = avgA < 180 ? "low" : "high";

  return (
    <code className=" w-full h-full mx-auto text-sm font-semibold ">
      <h1 className="text-xl">Insights</h1>
      Analysis suggests that this robot favors starting{" "}
      <span className="text-accent">{startingSide}</span> on the field, at{" "}
      <span className="text-accent">{startingAngle}</span> angles of attack.
      {matches < 5 ? (
        <span className="text-warning">
          {" "}
          <br />
          <br /> However, this robot has only competed in{" "}
          <span className="text-accent">{matches}</span> matches.
        </span>
      ) : (
        <>
          This robot has competed in {matches} matches and is very well characterized.
        </>
      )}
      <div>
        {
          props.dots.map((dot, index) => (
            <div key={index} className="badge badge-sm badge-primary">{dot.label}</div>
          ))
        }
      </div>
    </code>
  );
}
