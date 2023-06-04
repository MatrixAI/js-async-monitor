import type {
  Lockable,
  MultiLockRequest,
  ToString,
} from '@matrixai/async-locks';
import { LockBox, Lock } from '@matrixai/async-locks';
import {
  lockBox,
  defaultLockRequest,
  AsyncFunction,
  AsyncGeneratorFunction,
} from './utils';

interface AsyncMonitor {
  readonly [lockBox]: LockBox;
  readonly [defaultLockRequest]: MultiLockRequest;
}

function AsyncMonitor(
  defaultKey: ToString = '',
  defaultLockConstructor: new () => Lockable = Lock,
  ...defaultLockingParams: Parameters<Lockable['lock']>
) {
  return <
    T extends {
      new (...args: Array<any>);
    },
  >(
    constructor: T,
  ) => {
    const constructor_ = class extends constructor {
      public readonly [lockBox]: LockBox = new LockBox();
      public readonly [defaultLockRequest]: MultiLockRequest = [
        defaultKey.toString(),
        defaultLockConstructor,
        ...defaultLockingParams,
      ];
    };
    // Preserve the name
    Object.defineProperty(
      constructor_,
      'name',
      Object.getOwnPropertyDescriptor(constructor, 'name')!,
    );
    return constructor_;
  };
}

function lock(...requests: Array<MultiLockRequest>) {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    let kind;
    if (descriptor.value != null) {
      kind = 'value';
    } else if (descriptor.get != null) {
      kind = 'get';
    } else if (descriptor.set != null) {
      kind = 'set';
    }
    const f: Function = descriptor[kind]; // eslint-disable-line @typescript-eslint/ban-types
    if (typeof f !== 'function') {
      throw new TypeError(`${key} is not a function`);
    }
    if (f instanceof AsyncFunction) {
      descriptor[kind] = async function (...args) {
        if (requests.length === 0) {
          requests = [this[defaultLockRequest]];
        }
        return this[lockBox].withF(...requests, async () => {
          return f.apply(this, args);
        });
      };
    } else if (f instanceof AsyncGeneratorFunction) {
      descriptor[kind] = async function* (...args) {
        if (requests.length === 0) {
          requests = [this[defaultLockRequest]];
        }
        return yield* this[lockBox].withG(...requests, () => {
          return f.apply(this, args);
        });
      };
    } else {
      throw new TypeError(
        `${key} must be an asynchronous or asynchronous generator function`,
      );
    }
    Object.defineProperty(descriptor[kind], 'name', { value: key });
    return descriptor;
  };
}

export { AsyncMonitor, lock, lockBox, defaultLockRequest };
