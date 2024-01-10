import crypto from 'crypto';

const generateHmacSecret = () => {
	return crypto.randomBytes(32).toString('base64');
};

export default generateHmacSecret;
