import { NextApiRequest, NextApiResponse } from "next";
import Auth from "@/lib/Auth";

async function getAuth(req: NextApiRequest, res: NextApiResponse<any>) {
	const path = [
		"",
		...(Array.isArray(req.query.nextauth)
			? req.query.nextauth
			: [req.query.nextauth]),
	].join("/");

	if (path === "/signin/email" && process.env.RECAPTCHA_SECRET) {
		const { email, captchaToken } = req.body;
		const isHuman = await fetch(
			`https://www.google.com/recaptcha/api/siteverify`,
			{
				method: "post",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
				},
				body: `secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`,
			},
		)
			.then((res) => res.json())
			.then((json) => json.success)
			.catch((err) => {
				throw new Error(`Error in Google Siteverify API. ${err.message}`);
			});
		console.log("IS HUMAN", isHuman, email);
		if (!isHuman) {
			res.status(400).end();
			return;
		}
	}
	return Auth(req, res);
}

export default getAuth;
