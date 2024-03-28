import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { DndProvider } from "react-dnd";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { HTML5Backend } from "react-dnd-html5-backend";

import { NextSeo } from "next-seo";
import { ChangesModal } from "@/components/Modal";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
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
                url: "https://4026.org/robot.jpg.png",
                width: 800,
                height: 600,
                alt: "Og Image Alt",
                type: "image/jpeg",
              },
            ],
            siteName: "Gearbox",
          }}
        />

        <Component {...pageProps} />
      </DndProvider>
      <Analytics />
      <SpeedInsights />
    </SessionProvider>
  );
}
