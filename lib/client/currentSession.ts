import { useSession as useSessionAuth } from "next-auth/react";
import { User } from "../Types";
import { ISODateString } from "next-auth";
// abstraction for next-auth useSession, just makes typescript stuff tidy

export interface AdvancedSession {
    user: User | null
    expires: ISODateString
}

export function currentSession() {
    const { data: session, status } = useSessionAuth();
    
    var newSession = session as AdvancedSession;
    
    return {session: newSession, status: status}
}