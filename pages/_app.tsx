import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { DndProvider } from "react-dnd";

import { HTML5Backend } from "react-dnd-html5-backend";

import { NextSeo } from "next-seo";

import ReactGA from "react-ga4";
import { Toaster } from "react-hot-toast";

import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config.js";
import Head from "next/head";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const tailwind = resolveConfig(tailwindConfig);

if (
	process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID !== undefined &&
	process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID !== ""
)
	ReactGA.initialize(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID);

export default function App({
	Component,
	pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
	return (
		<>
			<Head>
				<link
					rel="manifest"
					href="/manifest.json"
				/>
			</Head>
			<SessionProvider session={session}>
				<DndProvider backend={HTML5Backend}>
					<NextSeo
						title="Gearbox"
						description="The best FIRST Scouting App"
						canonical="https://4026.org/"
						openGraph={{
							url: "https://4026.org/",
							title: "Gearbox",
							description: "The best FIRST Scouting App",
							images: [
								{
									url: "https://4026.org/art/4026Bench.svg",
									width: 800,
									height: 600,
									alt: "Og Image Alt",
									type: "image/jpeg",
								},
							],
							siteName: "Gearbox",
						}}
					/>
					<Toaster
						toastOptions={{
							style: {
								background: (
									tailwind.theme.backgroundColor["zinc"] as any
								)[900].toString(),
								color: tailwind.theme.textColor["base-100"].toString(),
							},
						}}
					/>
					<Component {...pageProps} />
				</DndProvider>
			</SessionProvider>
		</>
	);
}
