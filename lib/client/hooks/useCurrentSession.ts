import { useSession as useSession } from "next-auth/react";
import { User } from "../../Types";
import { ISODateString } from "next-auth";
import { ObjectId } from "bson";
import { useEffect, useState } from "react";
// abstraction for next-auth useSession, just makes typescript stuff tidy

export interface AdvancedSession {
  user: User | null;
  expires: ISODateString;
}

export function useCurrentSession() {
  const { data: session, status } = useSession();

  // Use state to prevent creating a new object each render
  const [returnValue, setReturnValue] = useState<{ session: AdvancedSession | null, status: typeof status }>({
    session: null,
    status
  });

  useEffect(() => {
    setReturnValue({
      session: session ? {
        user: {
          ...session.user,
          _id: new ObjectId((session.user as User | null)?._id)
        },
        expires: session.expires
      } as AdvancedSession : null,
      status
    });
  }, [session, status]);

  return returnValue;
}
