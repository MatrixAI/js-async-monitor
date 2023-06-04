const lockBox = Symbol('lockBox');
const defaultLockRequest = Symbol('defaultLockRequest');

const AsyncFunction = (async () => {}).constructor;
const AsyncGeneratorFunction = async function* () {}.constructor;

export { AsyncFunction, AsyncGeneratorFunction, lockBox, defaultLockRequest };
