import Card from "@/components/Card";
import Container from "@/components/Container";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Offline() {
	const router = useRouter();
	const [path, setPath] = useState<string>("loading...");

	useEffect(() => {
		setPath(location.href);
	}, [router]);

	return (
		<Container
			requireAuthentication={false}
			title="Offline"
		>
			<div className="w-full h-[70%] flex justify-center items-center">
				<Card>
					The page you are trying to access ({path}) is not available offline.
					If this is an error, please contact the developers.
				</Card>
			</div>
		</Container>
	);
}
