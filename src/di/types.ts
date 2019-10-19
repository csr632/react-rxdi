import { interfaces } from 'inversify';
import { isObject } from '../utils';

export interface IDIConatinerOpts {
  providers?: IProvider[];
  autoBindInjectable?: boolean;
}

/**
 * Token Types
 * Token can be a abstract class, which is not assignable to Newable
 */
export type IToken = CustomToken<any> | AbstractCtor<object> | symbol;
export type AbstractCtor<T> = Function & { prototype: T };
export class CustomToken<ValueType> {
  private readonly _reflectName = CustomToken.tokenReflectName;

  constructor(public readonly tokenId: string | symbol) {}

  // Don't use instanceOf, use Reflection instead.
  // Because user may have multi version of react-rxdi
  public static isCustomToken(value: any): value is CustomToken<any> {
    return (
      isObject(value) && value._reflectName === CustomToken.tokenReflectName
    );
  }

  private static readonly tokenReflectName = '@@RXDI Token v1@@' as const;
}

export type GetValueTypeByToken<Token> = Token extends CustomToken<
  infer ValueType
>
  ? ValueType
  : Token extends AbstractCtor<infer ValueType2>
  ? ValueType2
  : Token extends IToken
  ? any
  : never;
// GetValueTypeByToken Example:
// declare function testFn<Input>(v: Input): GetValueTypeByToken<Input>;
// declare const v1: CustomToken<{ aaa: number }>;
// const v2 = testFn(v1);
// abstract class ABClass {
//   bbb = 123;
// }
// const v3 = testFn(ABClass).bbb;
// class TestClass {
//   ccc = 123;
// }
// const v4 = testFn(TestClass).ccc;
// //// Example end

export function isToken(value: any): value is IToken {
  return (
    CustomToken.isCustomToken(value) ||
    isServiceCtor(value) ||
    typeof value === 'symbol'
  );
}

export function getActualToken(token: IToken): symbol {
  if (!isToken(token)) {
    console.error(
      `The given token is invalid.
    Fail to provide this token.
    Token:`,
      token
    );
    throw new Error(`The given token is invalid.
    Fail to provide this token.
    See the console.error above.`);
  }
  if (CustomToken.isCustomToken(token)) {
    return token.tokenId as symbol;
  }
  return token as symbol;
}

/**
 * Provider Types
 */
export type IProvider =
  | ServiceCtor
  | IClassProvider
  | IExistingProvider
  | IValueProvider
  | IFactoryProvider;
export type Newable<T> = interfaces.Newable<T>;
export type ServiceCtor = Newable<object>;
export interface IClassProvider {
  provide: IToken;
  useClass: ServiceCtor;
}
export interface IExistingProvider {
  provide: IToken;
  useExisting: IToken;
}
export interface IValueProvider {
  provide: IToken;
  useValue: any;
}
export interface IFactoryProvider {
  provide: IToken;
  useFactory: (...deps: any[]) => any;
  deps?: IToken[];
}

export function isServiceCtor(value: any): value is ServiceCtor {
  return (
    typeof value === 'function' &&
    isObject(value.prototype) &&
    value.prototype.constructor === value
  );
}
export function isClassProvider(value: any): value is IClassProvider {
  return (
    isObject(value) && isToken(value.provide) && isServiceCtor(value.useClass)
  );
}
export function isExistingProvider(value: any): value is IExistingProvider {
  return (
    isObject(value) && isToken(value.provide) && isToken(value.useExisting)
  );
}
export function isValueProvider(value: any): value is IValueProvider {
  return (
    isObject(value) &&
    isToken(value.provide) &&
    {}.hasOwnProperty.call(value, 'useValue')
  );
}
export function isFactoryProvider(value: any): value is IFactoryProvider {
  return (
    isObject(value) &&
    isToken(value.provide) &&
    typeof value.useFactory === 'function'
  );
}