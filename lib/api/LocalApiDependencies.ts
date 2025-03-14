import DbInterface from "../client/dbinterfaces/DbInterface";

type LocalApiDependencies = {
	dbPromise: Promise<DbInterface>;
};

export default LocalApiDependencies;
