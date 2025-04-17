import toast from "react-hot-toast";
import { RequestHelper } from "unified-api";
import LocalStorageDbInterface from "../client/dbinterfaces/LocalStorageDbInterface";
import LocalApiDependencies from "./LocalApiDependencies";
import {
	LocalStorage,
	UnavailableLocalStorage,
} from "../client/LocalStorageInterface";
import InMemoryDbInterface from "../client/dbinterfaces/InMemoryDbInterface";

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
			const db =
				typeof window !== "undefined"
					? new LocalStorageDbInterface()
					: new InMemoryDbInterface();
			await db.init();
			return db;
		})();

		return {
			dbPromise,
			localStorage:
				typeof window !== "undefined"
					? new LocalStorage(window.localStorage)
					: new UnavailableLocalStorage(),
		} as LocalApiDependencies;
	}
}
