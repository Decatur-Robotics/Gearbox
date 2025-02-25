import Avatar from "@/components/Avatar";
import Container from "@/components/Container";
import { levelToXp } from "@/lib/Xp";

const MAX_LEVEL = 120;

export default function Leveling() {
	return (
		<Container
			title="Leveling"
			requireAuthentication={false}
		>
			<h1 className="text-xl mb-4">Leveling</h1>
			<div className="grid grid-cols-10 gap-4 mx-4">
				{[...Array(MAX_LEVEL + 1).keys()].map((level) => (
					<div key={level}>
						<Avatar user={{ level, image: undefined }} />
						<p>
							Lvl: {level} - {levelToXp(level)} XP
						</p>
					</div>
				))}
			</div>
		</Container>
	);
}
