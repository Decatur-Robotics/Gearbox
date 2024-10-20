import { User as NextAuthUser } from "next-auth";
import { CreateEmailOptions, Resend } from 'resend';
import { getDatabase } from './MongoDB';
import { ObjectId } from "mongodb";
import { User } from "./Types";
import CollectionId from "./client/CollectionId";

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
    db.db?.collection(CollectionId.Users).updateOne({ email: user.email}, { $set: { resendContactId: res.data.id } });
  }

  export async function emailDevelopers(subject: string, message: string) {
    if (!process.env.DEVELOPER_EMAILS) {
      console.error("No developer emails found");
      return;
    }

    resend.emails.send({
      from: "Gearbox Server <server-no-reply@4026.org>",
      to: JSON.parse(process.env.DEVELOPER_EMAILS), // Environment variables are always strings, so we need to parse it
      subject,
      text: message,
    })
  }
}

export default ResendUtils;