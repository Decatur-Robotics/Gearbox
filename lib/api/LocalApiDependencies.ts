import DbInterface from "../client/dbinterfaces/DbInterface";
import LocalStorageInterface from "../client/LocalStorageInterface";

type LocalApiDependencies = {
	dbPromise: Promise<DbInterface>;
	localStorage: LocalStorageInterface;
};

export default LocalApiDependencies;
