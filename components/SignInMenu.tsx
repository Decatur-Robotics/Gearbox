import Container from "@/components/Container";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	GoogleReCaptchaProvider,
	useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { FaGoogle, FaSlack } from "react-icons/fa";

const errorMessages: { [error: string]: string } = {
	oauthcallback: "Failed to sign in with OAuth provider.",
	callback: "A server-side error occurred during sign in.",
};

function SignInCard() {
	const router = useRouter();
	const emailRef = useRef<HTMLInputElement>(null);
	const { executeRecaptcha } = useGoogleReCaptcha();

	const [error, setError] = useState<string>(router.query.error as string);

	useEffect(() => {
		if (router.query.error) {
			const error = (router.query.error as string).toLowerCase();
			const message =
				(error in errorMessages ? errorMessages[error] : error) +
				" Try clearing your cookies and then signing in again.";

			setError(message);
		}
	}, [router.query.error]);

	function signInWithCallbackUrl(provider: string, options?: object) {
		const callbackUrl = router.query.callbackUrl as string;

		signIn(provider, { callbackUrl, ...options });
	}
	async function logInWithEmail() {
		const email = emailRef.current?.value;

		if (!email) {
			setError("Email is required");
			return;
		}

		if (!executeRecaptcha) {
			setError("Recaptcha not available");
			return;
		}

		const captchaToken = await executeRecaptcha();

		signInWithCallbackUrl("email", { email, captchaToken });
	}

	return (
		<div className="card bg-base-300 w-5/6 md:w-1/2">
			<div className="card-body">
				<h1 className="card-title">Sign In</h1>
				{error && <p className="text-error">{error}</p>}
				<p className="italic">Choose a login provider</p>
				<span>
					You currently <span className="text-red-500">have</span> to sign-in
					using either your{" "}
					<span className="text-green-400">original sign-in method</span> or
					your <span className="text-green-400">email.</span>
				</span>
				<div className="divider" />

				<button
					onClick={() => signInWithCallbackUrl("google")}
					className="btn btn-primary w-full font-bold text-md"
				>
					<FaGoogle />
					Login with Google
				</button>

				<button
					onClick={() => signInWithCallbackUrl("slack")}
					className="btn btn-secondary w-full font-bold text-md"
				>
					<FaSlack />
					Login with Slack
				</button>

				<div className="divider" />
				<div className="flex flex-col gap-2">
					<p>Email Sign In</p>
					<input
						ref={emailRef}
						className="input input-bordered w-full"
						type="email"
						placeholder="Email"
					/>
					<button
						onClick={logInWithEmail}
						className="btn btn-accent w-full font-bold text-md"
					>
						Login with Email
					</button>
				</div>
			</div>
		</div>
	);
}

export default function SignInMenu() {
	return (
		<GoogleReCaptchaProvider
			reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_KEY}
		>
			<div className="p-12 flex flex-col items-center justify-center">
				<SignInCard />
			</div>
		</GoogleReCaptchaProvider>
	);
}
