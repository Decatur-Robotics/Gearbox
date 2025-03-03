export enum LogLevel {
	Error,
	Warning,
	Info,
	Debug,
}

export default class Logger {
	constructor(
		private tags: string[],
		private enabled: boolean = true,
	) {}

	private prefix(level: LogLevel) {
		return `[${this.tags.join(", ")}] [${LogLevel[level]}]`;
	}

	public extend(tags: string[]) {
		return new Logger([...this.tags, ...tags], this.enabled);
	}

	public print(level: LogLevel, ...args: unknown[]) {
		if (!this.enabled) return;

		const prefix = this.prefix(level);

		if (level === LogLevel.Error) {
			console.error(prefix, ...args);
		} else if (level === LogLevel.Warning) {
			console.warn(prefix, ...args);
		} else if (level === LogLevel.Info) {
			console.info(prefix, ...args);
		} else if (level === LogLevel.Debug) {
			console.debug(prefix, ...args);
		}
	}

	public error(...args: unknown[]) {
		this.print(LogLevel.Error, ...args);
	}

	public warn(...args: unknown[]) {
		this.print(LogLevel.Warning, ...args);
	}

	public info(...args: unknown[]) {
		this.print(LogLevel.Info, ...args);
	}

	public debug(...args: unknown[]) {
		this.print(LogLevel.Debug, ...args);
	}

	public log(...args: unknown[]) {
		this.info(...args);
	}
}
