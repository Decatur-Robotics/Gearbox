import { FaGoogle, FaSlack } from "react-icons/fa";

export default function SignIn() {
	return (
		<div className="h-screen w-screen flex flex-col items-center justify-center">
			<div className="card bg-base-300 w-5/6 md:w-1/2">
				<div className="card-body">
					<h1 className="card-title">Sign In</h1>
					<p className="font-mono">Choose a login provider</p>
					<div className="divider"></div>
					<a href="https://4026.org/api/auth/signin/google">
						<button className="btn w-full bg-white text-slate-800 font-bold text-md">
							<FaGoogle></FaGoogle>Login with Google
						</button>
					</a>

					<h2 className="mt-4 font-semibold">For Team 4026 Only:</h2>
					<button className="btn w-full bg-purple-500 text-slate-800 font-bold text-md">
						<FaSlack></FaSlack> Login with Slack
					</button>
				</div>
			</div>
		</div>
	);
}
