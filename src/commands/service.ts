/* eslint-disable no-console */
import { execSync } from 'child_process';
import crypto from 'crypto';
import fsp from 'fs/promises';

import * as bcrypt from 'bcrypt';
import { Command } from 'commander';
import { rimrafSync } from 'rimraf';

interface ServiceOptions {
	action: 'install' | 'remove' | 'start' | 'stop';
	user: boolean;
	password: string;
	removeConfig: boolean;
}

const service = async (cmd: Command, options: ServiceOptions) => {
	if (process.getuid?.() != 0) {
		console.log('You need to execute service commands as root');
		process.exit(1);
	}

	switch (options.action) {
		case 'install': {
			console.log('Creating Systemd service');

			let uid: number | null = null;
			let gid: number | null = null;
			if (options.user) {
				console.log('Creating system user and group for signo');
				let ids = getUserAndGroupId('signo');

				if (ids) {
					console.log('Signo user already exists');
					uid = ids[0];
					gid = ids[1];
				} else {
					execSync('groupadd signo');
					execSync('useradd -g signo signo');
					ids = getUserAndGroupId('signo');

					if (!ids) {
						console.log('Failed to create system users');
						process.exit(1);
					}

					uid = ids[0];
					gid = ids[1];
				}
			}

			console.log('Creating configuration under /etc/signo');
			await fsp.mkdir('/etc/signo');
			if (uid && gid) {
				await fsp.chown('/etc/signo', 0, gid);
				await fsp.chmod('/etc/signo', 0o770);
			}

			await fsp.writeFile(
				'/etc/signo/signo.yml',
				`https:
  port: ${options.user ? '3500' : '443'}
  key: signo.key
  cert: signo.crt
  secret: ${crypto.randomBytes(64).toString('base64')}
  adminPassword: ${await bcrypt.hash(options.password, 10)}
database:
  type: sqlite
  database: signo.sqlite
pkcs11Modules:
`
			);
			if (uid && gid) {
				await fsp.chown('/etc/signo/signo.yml', 0, gid);
				await fsp.chmod('/etc/signo/signo.yml', 0o770);
			}

			console.log('Create log directory');
			await fsp.mkdir('/var/log/signo');
			if (uid && gid) {
				await fsp.chown('/var/log/signo', 0, gid);
				await fsp.chmod('/var/log/signo', 0o774);
			}

			console.log('Creating systemd service');
			await fsp.writeFile(
				'/etc/systemd/system/signo.service',
				`[Unit]
Description=Signo signing service
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=5
${options.user ? 'User=signo' : ''}
ExecStart=signo --log-level info --log-file /var/log/signo/signo.log --crypto-log-file /var/log/signo/crypto.log start -c /etc/signo/signo.yml

[Install]
WantedBy=multi-user.target
`
			);

			console.log('Reload service definitions');
			execSync('systemctl daemon-reload');

			console.log('\n\n\nFurther steps:');
			console.log(
				' - You need to set a certificate and a private key in /etc/signo/signo.key and /etc/signo/signo.crt'
			);
			console.log(
				' - You need to set PKCS#11 modules in /etc/signo/signo.yml'
			);
			console.log(
				' - You need to start the service using `signo service start`'
			);
			break;
		}
		case 'remove': {
			console.log('Remove signo systemd service');

			console.log('Stopping and disabling systemd service');
			execSync('systemctl stop signo');
			execSync('systemctl disable signo');

			console.log('Removing service definition');
			await fsp.unlink('/etc/systemd/system/signo.service');

			if (options.removeConfig) {
				console.log('Removing config files and logs');
				rimrafSync('/etc/signo');
				rimrafSync('/var/log/signo');
			}
			break;
		}
		case 'start': {
			console.log('Enabling signo service');
			execSync('systemctl enable signo');

			console.log('Starting signo service');
			execSync('systemctl start signo');
			break;
		}
		case 'stop': {
			console.log('Stopping signo service');
			execSync('systemctl stop signo');
			break;
		}
		default: {
			console.log('Unknown action');
			process.exit(1);
		}
	}
};

const getUserAndGroupId = (user: string): [number, number] | null => {
	try {
		const uid = parseInt(execSync(`id -u ${user}`).toString());
		const gid = parseInt(execSync(`id -g ${user}`).toString());

		return [uid, gid];
	} catch {
		return null;
	}
};

export default service;
