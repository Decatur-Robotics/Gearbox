export default interface LocalStorageInterface {
	get: <T>(key: string) => Promise<T | undefined>;
	set: <T>(key: string, value: T) => Promise<void>;
}

export class MockLocalStorage implements LocalStorageInterface {
	private storage: Record<string, any> = {};

	async get<T>(key: string): Promise<T | undefined> {
		return this.storage[key];
	}

	async set<T>(key: string, value: T): Promise<void> {
		this.storage[key] = value;
	}
}

export class LocalStorage implements LocalStorageInterface {
	private storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
	}

	async get<T>(key: string): Promise<T | undefined> {
		const value = this.storage.getItem(key);
		if (value) {
			return JSON.parse(value) as T;
		}
		return undefined;
	}

	async set<T>(key: string, value: T): Promise<void> {
		this.storage.setItem(key, JSON.stringify(value));
	}
}
