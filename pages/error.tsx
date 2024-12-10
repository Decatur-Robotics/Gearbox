import Card from "@/components/Card";
import Container from "@/components/Container";
import { useRouter } from "next/router";

export default function PageNotFound() {
	const router = useRouter();
	const { message, code } = router.query;

	return (
		<Container
			requireAuthentication={false}
			title={`Error: ${code ?? "..."}`}
		>
			<div className="w-screen h-screen bg-base-300 flex items-center justify-center">
				<div className="card w-5/6 md:w-1/4 bg-base-100 shadow-xl rounded-xl">
					<div className="card-body flex items-center justify-center">
						<img src="/art/BrokenRobotExtra.svg"></img>
						<h1 className="text-8xl font-bold text-error">{code}</h1>
						<h1 className="card-title text-4xl">😔➡️🤖➡️💥</h1>
						<p className="font-mono">{message}</p>
						<button
							className="btn btn-primary btn-lg"
							onClick={() => {
								history.back();
							}}
						>
							Go Back
						</button>
					</div>
				</div>
			</div>
		</Container>
	);
}
