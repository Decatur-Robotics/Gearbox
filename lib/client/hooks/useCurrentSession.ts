import { useSession as useSession } from "next-auth/react";
import { User } from "../../Types";
import { ISODateString } from "next-auth";
import { ObjectId } from "bson";
// abstraction for next-auth useSession, just makes typescript stuff tidy

export interface AdvancedSession {
  user: User | null;
  expires: ISODateString;
}

export function useCurrentSession() {
  const { data: session, status } = useSession();
  const user = session?.user as User | null;

  return { 
    session: { 
      user: user 
        ? {
          ...user,
          _id: new ObjectId(user?._id)
        }
        : null 
    } as AdvancedSession, 
    status 
  };
}
