import toast from "react-hot-toast";
import { RequestHelper } from "unified-api";
import LocalStorageDbInterface from "../client/dbinterfaces/LocalStorageDbInterface";
import LocalApiDependencies from "./LocalApiDependencies";
export default class GearboxRequestHelper extends RequestHelper {
	constructor() {
		super(
			process.env.NEXT_PUBLIC_API_URL ?? "", // Replace undefined when env is not present (ex: for testing builds)
			(url) =>
				toast.error(
					`Failed API request: ${url}. If this is an error, please contact the developers.`,
				),
		);
	}

	async getLocalDependencies() {
		const dbPromise = (async () => {
			const db = new LocalStorageDbInterface();
			await db.init();
			return db;
		})();

		return {
			dbPromise,
		} as LocalApiDependencies;
	}
}
