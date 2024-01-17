const OIDs = {
	digestAlgos: {
		SHA1: '1.3.14.3.2.26',
		SHA256: '2.16.840.1.101.3.4.2.1',
		SHA512: '2.16.840.1.101.3.4.2.3'
	},
	signAlgos: {
		RSA: {
			SHA1: '1.2.840.113549.1.1.5',
			SHA256: '1.2.840.113549.1.1.11',
			SHA512: '1.2.840.113549.1.1.13'
		},
		DSA: {
			SHA1: '1.3.14.3.2.27',
			SHA256: '2.16.840.1.101.3.4.3.2',
			SHA512: 'N/A'
		},
		ECDSA: {
			SHA1: '1.2.840.10045.4.1',
			SHA256: '1.2.840.10045.4.3.2',
			SHA512: '1.2.840.10045.4.3.4'
		}
	}
};

export default OIDs;