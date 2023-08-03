import { SessionProvider } from "next-auth/react"
import "../styles/globals.css"
import type { AppProps } from "next/app"
import type { Session } from "next-auth"
import { useSession } from "next-auth/react"

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.


function UserSection() {
  const { data: sess, status } = useSession();
  var userImageUrl = sess?.user?.image || "/user.jpg";

  if(status === "authenticated") {
      return <div>
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                  <img src={userImageUrl}/>
              </div>
          </label>

          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><a href="/profile">Profile</a></li>
              <li><a href="/api/auth/signout">Logout</a></li>
          </ul>
      </div>
  }

    return <a className="btn btn-primary normal-case" href="/api/auth/signin">Sign Up</a>
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) {

  return (
    <SessionProvider session={session}>
      <div className="w-full h-screen flex flex-col bg-base">
          <div className="navbar bg-base-100 sticky top-0 z-40">
              <div className="flex-1 -space-x-1">
                  <a className="btn btn-ghost normal-case text-xl">Gearbox</a>
              </div>
              <div className="flex-none gap-6">

                  <ul className="menu menu-horizontal px-1">
                      <li><a>About</a></li>
                      <li><a>Contact</a></li>
                  </ul>

                  <div className="dropdown dropdown-end">
                      <UserSection></UserSection>
                  </div>

              </div>
          </div>
         <Component {...pageProps} />
      </div>
    </SessionProvider>
  )
}