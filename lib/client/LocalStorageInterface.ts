export default interface LocalStorageInterface {
	get: <T>(key: string) => Promise<T | undefined>;
	set: (key: string, value: any) => Promise<void>;
}

export class MockLocalStorage implements LocalStorageInterface {
	private storage: Record<string, any> = {};

	async get<T>(key: string): Promise<T | undefined> {
		return this.storage[key];
	}

	async set(key: string, value: any): Promise<void> {
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

	async set(key: string, value: any): Promise<void> {
		this.storage.setItem(key, JSON.stringify(value));
	}
}

export class UnavailableLocalStorage implements LocalStorageInterface {
	async get<T>(key: string): Promise<T | undefined> {
		throw new Error("Local storage is unavailable");
	}

	async set(key: string, value: any): Promise<void> {
		throw new Error("Local storage is unavailable");
	}
}
