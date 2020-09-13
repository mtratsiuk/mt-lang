export type Compose = <T, R1, R2>(
  g: (x: R1) => R2,
  f: (x: T) => R1,
) => (x: T) => R2;
export const compose: Compose = (g, f) => (x) => g(f(x));

export type Pipe = <T, R1, R2>(
  f: (x: T) => R1,
  g: (x: R1) => R2,
) => (x: T) => R2;
export const pipe: Pipe = (f, g) => (x) => g(f(x));

export type IsEmpty = <T>(array: T[]) => boolean;
export const isEmpty: IsEmpty = (array) => array.length === 0;

export type Const = <T>(x: T) => () => T;
export const cnst: Const = (x) => () => x;

export type Identity = <T>(x: T) => T;
export const id: Identity = (x) => x;

export type Pass = () => never;
export const pass: Pass = () => {
  throw new Error("pass");
};
