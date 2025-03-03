import { User as NextAuthUser } from "next-auth";
import { Resend } from "resend";
import { getDatabase } from "./MongoDB";
import { User } from "./Types";
import CollectionId from "./client/CollectionId";
import { ObjectId } from "bson";

export interface ResendInterface {
	createContact: (rawUser: NextAuthUser) => Promise<void>;
	emailDevelopers: (subject: string, message: string) => void;
}

export class ResendUtils implements ResendInterface {
	private static resend: Resend;

	constructor() {
		ResendUtils.resend ??= new Resend(process.env.SMTP_PASSWORD);
	}

	async createContact(rawUser: NextAuthUser) {
		const user = rawUser as User;

		if (user.resendContactId) return;

		if (!user.email || !user.name) {
			console.error("User is missing email or name", user);
			return;
		}

		console.log("Creating contact for", user.email);

		const nameParts = user.name?.split(" ");

		const res = await ResendUtils.resend.contacts.create({
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
		const id = (await db.findObject(CollectionId.Users, { email: user.email }))
			?._id;
		if (!id) {
			console.error("User not found in database", user.email);
			return;
		}

		db.updateObjectById(CollectionId.Users, new ObjectId(id), {
			resendContactId: res.data.id,
		});
	}

	async emailDevelopers(subject: string, message: string) {
		if (!process.env.DEVELOPER_EMAILS) {
			console.error("No developer emails found");
			return;
		}

		ResendUtils.resend.emails.send({
			from: "Gearbox Server <server-no-reply@4026.org>",
			to: JSON.parse(process.env.DEVELOPER_EMAILS), // Environment variables are always strings, so we need to parse it
			subject,
			text: message,
		});
	}
}

export default ResendUtils;
