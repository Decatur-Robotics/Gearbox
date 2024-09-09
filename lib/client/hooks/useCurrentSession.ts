import { useSession as useSession } from "next-auth/react";
import { User } from "../../Types";
import { ISODateString } from "next-auth";
// abstraction for next-auth useSession, just makes typescript stuff tidy

export interface AdvancedSession {
  user: User | null;
  expires: ISODateString;
}

export function useCurrentSession() {
  const { data: session, status } = useSession();
  return { session: session as AdvancedSession, status };
}
