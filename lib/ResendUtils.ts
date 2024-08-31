import { User as NextAuthUser } from "next-auth";
import { Resend } from 'resend';
import { getDatabase, Collections } from './MongoDB';
import { ObjectId } from "mongodb";
import { User } from "./Types";

const resend = new Resend(process.env.SMTP_PASSWORD);

namespace ResendUtils {
  export async function createContact(rawUser: NextAuthUser) {
    const user = rawUser as User;

    if (user.resendContactId)
      return;

    if (!user.email || !user.name) {
      console.error("User is missing email or name", user);
      return;
    }

    console.log("Creating contact for", user.email);

    const nameParts = user.name?.split(" ");

    const res = await resend.contacts.create({
      email: user.email,
      firstName: nameParts[0],
      lastName: nameParts.length > 1 ? nameParts[1] : "",
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });

    if (!res.data?.id) {
      console.error("Failed to create contact for", user.email);
      console.error(res);
      return;
    }

    const db = await getDatabase();
    // Going around our own interface is a red flag, but it's 11 PM and I'm tired -Renato
    db.db?.collection(Collections.Users).updateOne({ email: user.email}, { $set: { resendContactId: res.data.id } });
  }
}

export default ResendUtils;