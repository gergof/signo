import AuthenticodeSigningEngine from './AuthenticodeSigningEngine.js';
import PlainSigningEngine from './PlainSigningEngine.js';

export enum SigningEngineType {
	authenticode = 'authenticode',
	plain = 'plain'
}

const SigningEngines = {
	[SigningEngineType.authenticode]: AuthenticodeSigningEngine,
	[SigningEngineType.plain]: PlainSigningEngine
};

export default SigningEngines;
