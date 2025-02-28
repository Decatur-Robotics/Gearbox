import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	GoogleReCaptchaProvider,
	useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { FaGoogle, FaSlack } from "react-icons/fa";

export default function SignIn() {
	const router = useRouter();
	const emailRef = useRef<HTMLInputElement>(null);
	const { executeRecaptcha } = useGoogleReCaptcha();

	const [error, setError] = useState<string>(router.query.error as string);
	const [captchaToken, setCaptchaToken] = useState<string>();

	useEffect(() => {
		if (router.query.error) {
			setError(router.query.error as string);
		}
	}, [router.query.error]);

	function signInWithCallbackUrl(provider: string, options?: object) {
		const callbackUrl = router.query.callbackUrl as string;

		signIn(provider, { callbackUrl, ...options });
	}

	function logInWithEmail() {
		const email = emailRef.current?.value;

		if (!email) {
			setError("Email is required");
			return;
		}

		if (!captchaToken) {
			setError("Please verify you are human");
			return;
		}

		signInWithCallbackUrl("email", { email, captchaToken });
	}

	const verifyCaptcha = useCallback(async () => {
		if (!executeRecaptcha) {
			setError("Recaptcha not available");
			return;
		}

		const token = await executeRecaptcha("login");
		setCaptchaToken(token);
	}, [executeRecaptcha]);

	return (
		<div className="h-screen w-screen flex flex-col items-center justify-center">
			<div className="card bg-base-300 w-5/6 md:w-1/2">
				<div className="card-body">
					<h1 className="card-title">Sign In</h1>
					{error && <p className="text-error">{error}</p>}
					<p>Choose a login provider</p>
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
						{!captchaToken && (
							<button
								onClick={verifyCaptcha}
								className="btn btn-accent w-full font-bold text-md"
							>
								Verify Captcha
							</button>
						)}
						<button
							onClick={logInWithEmail}
							className="btn btn-accent w-full font-bold text-md"
						>
							Login with Email
						</button>
						{captchaToken && <p className="text-success">Captcha verified!</p>}
					</div>
				</div>
			</div>
		</div>
	);
}
