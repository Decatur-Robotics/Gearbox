import Rollbar from "rollbar";
import getRollbar from "../RollbarUtil";
export enum LogLevel {
	Error,
	Warning,
	Info,
	Debug,
}

export default class Logger {
	private static rollbar: Rollbar | undefined;

	/**
	 * @param rollbarThreshold Pass undefined to disable Rollbar
	 */
	constructor(
		private tags: string[],
		private rollbarThreshold: LogLevel | undefined = LogLevel.Warning,
		private enabled: boolean = true,
	) {
		if (rollbarThreshold != undefined && !Logger.rollbar)
			Logger.rollbar = getRollbar();
	}

	private prefix(level: LogLevel) {
		return `[${this.tags.join(", ")}] [${LogLevel[level]}]`;
	}

	public extend(tags: string[]) {
		return new Logger(
			[...this.tags, ...tags],
			this.rollbarThreshold,
			this.enabled,
		);
	}

	public event(level: LogLevel, ...args: unknown[]) {
		if (!this.enabled) return;

		if (this.rollbarThreshold !== undefined && level <= this.rollbarThreshold) {
			const msg = args
				.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
				.join(" ");

			switch (level) {
				case LogLevel.Error:
					Logger.rollbar!.error(msg);
					break;
				case LogLevel.Warning:
					Logger.rollbar!.warning(msg);
					break;
				case LogLevel.Info:
					Logger.rollbar!.info(msg);
					break;
				case LogLevel.Debug:
					Logger.rollbar!.debug(msg);
					break;
			}
		}

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
		this.event(LogLevel.Error, ...args);
	}

	public warn(...args: unknown[]) {
		this.event(LogLevel.Warning, ...args);
	}

	public info(...args: unknown[]) {
		this.event(LogLevel.Info, ...args);
	}

	public debug(...args: unknown[]) {
		this.event(LogLevel.Debug, ...args);
	}

	public log(...args: unknown[]) {
		this.info(...args);
	}
}
