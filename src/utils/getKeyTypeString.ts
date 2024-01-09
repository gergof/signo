import * as pkcs11 from 'graphene-pk11';

import assertUnreachable from './assertUnreachable.js';

const getKeyTypeString = (type: pkcs11.KeyType) => {
	switch (type) {
		case pkcs11.KeyType.RSA:
			return 'RSA';
		case pkcs11.KeyType.DSA:
			return 'DSA';
		case pkcs11.KeyType.DH:
			return 'DH';
		case pkcs11.KeyType.ECDSA:
			return 'ECDSA';
		case pkcs11.KeyType.EC:
			return 'EC';
		case pkcs11.KeyType.X9_42_DH:
			return 'X9_42_DH';
		case pkcs11.KeyType.KEA:
			return 'KEA';
		case pkcs11.KeyType.GENERIC_SECRET:
			return 'GENERIC_SECRET';
		case pkcs11.KeyType.RC2:
			return 'RC2';
		case pkcs11.KeyType.RC4:
			return 'RC4';
		case pkcs11.KeyType.DES:
			return 'DES';
		case pkcs11.KeyType.DES2:
			return 'DES2';
		case pkcs11.KeyType.DES3:
			return 'DES3';
		case pkcs11.KeyType.CAST:
			return 'CAST';
		case pkcs11.KeyType.CAST3:
			return 'CAST3';
		case pkcs11.KeyType.CAST5:
			return 'CAST5';
		case pkcs11.KeyType.CAST128:
			return 'CAST128';
		case pkcs11.KeyType.RC5:
			return 'RC5';
		case pkcs11.KeyType.IDEA:
			return 'IDEA';
		case pkcs11.KeyType.SKIPJACK:
			return 'SKIPJACK';
		case pkcs11.KeyType.BATON:
			return 'BATON';
		case pkcs11.KeyType.JUNIPER:
			return 'JUNIPER';
		case pkcs11.KeyType.CDMF:
			return 'CDMF';
		case pkcs11.KeyType.AES:
			return 'AES';
		case pkcs11.KeyType.GOSTR3410:
			return 'GOSTR3410';
		case pkcs11.KeyType.GOSTR3411:
			return 'GOSTR3411';
		case pkcs11.KeyType.GOST28147:
			return 'GOST28147';
		case pkcs11.KeyType.BLOWFISH:
			return 'BLOWFISH';
		case pkcs11.KeyType.TWOFISH:
			return 'TWOFISH';
		case pkcs11.KeyType.SECURID:
			return 'SECURID';
		case pkcs11.KeyType.HOTP:
			return 'HOTP';
		case pkcs11.KeyType.ACTI:
			return 'ACTI';
		case pkcs11.KeyType.CAMELLIA:
			return 'CAMELLIA';
		case pkcs11.KeyType.ARIA:
			return 'ARIA';
		default:
			return assertUnreachable(type);
	}
};

export default getKeyTypeString;
