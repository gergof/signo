import PlainSigningEngine from './PlainSigningEngine.js';

export enum SigningEngineType {
	plain = 'plain'
}

const SigningEngines = {
	[SigningEngineType.plain]: PlainSigningEngine
};

export default SigningEngines;
