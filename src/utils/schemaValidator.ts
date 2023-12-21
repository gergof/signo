import { TObject } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

interface ValidatorFactoryReturn<T> {
	schema: TObject;
	verify: (data: T) => T;
}

const validatorFactory = <T>(schema: TObject): ValidatorFactoryReturn<T> => {
	const C = TypeCompiler.Compile(schema);

	const verify = (data: T): T => {
		const isValid = C.Check(data);
		if (isValid) {
			return data;
		}
		throw new Error(
			JSON.stringify(
				[...C.Errors(data)].map(({ path, message }) => ({
					path,
					message
				}))
			)
		);
	};

	return { schema, verify };
};

export default validatorFactory;
