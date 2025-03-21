import Container from "@/components/Container";
import SignInMenu from "@/components/SignInMenu";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	GoogleReCaptchaProvider,
	useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { FaGoogle, FaSlack } from "react-icons/fa";

export default function SignIn() {
	return (
		<Container
			requireAuthentication={false}
			title="Sign In"
		>
			<SignInMenu />
		</Container>
	);
}
