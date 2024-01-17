/* eslint-disable no-console */
import crypto from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import { Blob } from 'node:buffer';
import path from 'path';
import { Readable } from 'stream';
import streamp from 'stream/promises';

import hmac from '@opsvent/hmac';
import { Command } from 'commander';
import { FormDataEncoder } from 'form-data-encoder';
import { FormData, File } from 'formdata-node';
import fetch from 'node-fetch';

interface SignOptions {
	server: string;
	client: string;
	secret: string;
	engine: string;
	file: string;
	output?: string;
	unsafe: boolean;
}

const sign = async (cmd: Command, options: SignOptions) => {
	console.log('Signing file using Signo server');

	if (options.unsafe) {
		console.log('! WARNING !');
		console.log('Accepting any unsafe certificate');
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
	}

	console.log('- Reading file into buffer');
	const data = await fsp.readFile(path.resolve(options.file));

	console.log('- Hashing file');
	const hash = crypto.createHash('sha3-512').update(data).digest('hex');

	const endpoint = new URL(`api/sign/${options.engine}`, options.server);
	console.log(`- File will be sent to ${endpoint.href}`);

	const sig = hmac.sign(
		{
			method: 'POST',
			url: `/api/sign/${options.engine}`,
			body: hash
		},
		{
			id: options.client,
			key: options.secret
		}
	);

	const form = new FormData();
	form.set(
		'file',
		new File([new Blob([data])], options.file, {
			type: 'application/octet-stream'
		})
	);
	const encoder = new FormDataEncoder(form);

	console.log('- Sending request');
	const resp = await fetch(endpoint.href, {
		method: 'POST',
		headers: {
			...encoder.headers,
			Authorization: sig
		},
		body: Readable.from(encoder.encode())
	});

	if (resp.status != 200 || !resp.body) {
		console.log('! Error !');
		console.log('Status code:', resp.status);
		console.log('Message:', resp.statusText);
		console.log('Body:', await resp.json());
		process.exit(1);
	}

	if (options.output) {
		console.log(`- Outputting signature to ${options.output}`);
		const writeStream = fs.createWriteStream(path.resolve(options.output));
		await streamp.finished(resp.body.pipe(writeStream));
	} else {
		const signature = await resp.arrayBuffer();
		console.log('Signature (in hex):');
		console.log(Buffer.from(signature).toString('hex'));
	}
};

export default sign;
