import { SessionProvider } from "next-auth/react"
import "../styles/globals.css"
import type { AppProps } from "next/app"
import type { Session } from "next-auth"
import { DndProvider } from 'react-dnd'
import { Analytics } from "@vercel/analytics/react"
import { HTML5Backend } from 'react-dnd-html5-backend'


export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) {

  return (
    <SessionProvider session={session}>
      <DndProvider backend={HTML5Backend}>
        <Component {...pageProps} />
      </DndProvider>
      <Analytics />
    </SessionProvider>
  )
}