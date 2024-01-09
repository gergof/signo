const assertUnreachable = (_: never): never => {
	throw new Error('This should not be reached');
};

export default assertUnreachable;
