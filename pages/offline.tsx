import Card from "@/components/Card";
import Container from "@/components/Container";
import { useRouter } from "next/router";

export default function Offline() {
	const router = useRouter();

	return (
		<Container
			requireAuthentication={false}
			title="Offline"
		>
			<div className="w-full h-[70%] flex justify-center items-center">
				<Card>
					The page you are trying to access ({router.pathname}) is not available
					offline. If this is an error, please contact the developers.
				</Card>
			</div>
		</Container>
	);
}
