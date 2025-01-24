import Avatar from "@/components/Avatar";

const MAX_LEVEL = 100;

export default function Leveling() {
	return (
		<div>
			<h1>Leveling</h1>
			<div className="grid grid-cols-10 gap-4">
        {[...Array(MAX_LEVEL).keys()].map((level) => (
          <Avatar key={level} user={{ level, image: undefined }} />
        ))}
      </div>
		</div>
	);
}
