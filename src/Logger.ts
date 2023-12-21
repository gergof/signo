import Winston from 'winston';

interface LogConfig {
	level: string;
	format: string;
	file: string;
	cryptoFile?: string;
}

class Logger {
	private winston: Winston.Logger;

	constructor(config: LogConfig) {
		this.winston = Winston.createLogger({
			level: config.level,
			levels: Object.assign({ crypto: 0 }, Winston.config.syslog.levels),
			format:
				config.format == 'json'
					? Winston.format.combine(
							Winston.format.timestamp(),
							Winston.format.json()
						)
					: Winston.format.combine(
							Winston.format.timestamp(),
							Winston.format.printf(info => {
								const {
									timestamp,
									level,
									group,
									message,
									...extra
								} = info;

								const extraInfo = Object.keys(extra)
									.map(
										key =>
											`\t> ${key.padEnd(15, ' ')} - ${
												extra[key] instanceof Object ||
												extra[key] instanceof Array
													? JSON.stringify(extra[key])
													: extra[key]
											}`
									)
									.join('\n');

								return `${timestamp} - ${level.padEnd(
									5,
									' '
								)} - ${group.padEnd(15, ' ')} - ${message}${
									extraInfo ? '\n' + extraInfo : ''
								}`;
							})
						),
			transports: [
				new Winston.transports.Console(),
				new Winston.transports.File({
					filename: config.file,
					maxsize: 10485760,
					maxFiles: 50,
					tailable: true
				}),
				...(config.cryptoFile
					? [
							new Winston.transports.File({
								filename: config.cryptoFile,
								level: 'crypto'
							})
						]
					: [])
			]
		});
	}

	createLogger(group: string): Winston.Logger {
		return this.winston.child({ group });
	}
}

export default Logger;
export type ChildLogger = Winston.Logger;
