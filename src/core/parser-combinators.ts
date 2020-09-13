import { State } from "./parser-state.ts";

export type Parser<T> = (state: State) => [T | null, State];

export type PT<T> = T extends Parser<infer K> ? K : T;

export type RunParser = <T>(
  source: string,
  parser: Parser<T>,
) => ReturnType<typeof parser>;
export const runParser: RunParser = (
  source,
  parser,
) => {
  return parser(new State({ source }));
};

export type Parse = <T>(
  source: string,
  parser: Parser<T>,
) => ReturnType<typeof parser>[0];
export const parse: Parse = (source, parser) => {
  return runParser(source, parser)[0];
};

export class SeqBreakSignal {}
export type EmitParser = <T>(p: Parser<T>) => T;
export type GetState = () => State;

export const createEmitParser: (state: State) => [EmitParser, GetState] = (
  state,
) => {
  let currentState = state;

  const emitParser: EmitParser = (parser) => {
    const [result, newState] = parser(currentState);

    if (result === null) {
      throw new SeqBreakSignal();
    }

    currentState = newState;

    return result;
  };

  return [emitParser, () => currentState];
};

export type Seq = <R>(seq: (emit: EmitParser) => R) => Parser<R>;
export const seq: Seq = (sequence) =>
  (state) => {
    const [emit, getState] = createEmitParser(state);

    try {
      const result = sequence(emit);

      return [result, getState()];
    } catch (error) {
      if (error instanceof SeqBreakSignal) {
        return [null, state];
      }

      throw error;
    }
  };

export type CreateParser = <T>(
  test: (param: T, char: string) => boolean,
) => (param: T) => Parser<string>;
export const createParser: CreateParser = (test) =>
  (param) =>
    (state) => {
      const char = state.peek();

      if (test(param, char)) {
        return [char, state.clone().nextChar()];
      }

      return [null, state];
    };

export type Map = <T, K>(parser: Parser<T>, f: (x: T) => K) => Parser<K>;
export const map: Map = (parser, f) =>
  (state) => {
    const [result, newState] = parser(state);

    if (result === null) {
      return [null, state];
    }

    return [f(result), newState];
  };

export type MapState = <T>(
  parser: Parser<T>,
  f: (x: T, s: State) => State,
) => Parser<T>;
export const mapState: MapState = (parser, f) =>
  (state) => {
    const [result, newState] = parser(state);

    if (result === null) {
      return [null, state];
    }

    return [result, f(result, newState.clone())];
  };

export type Many = <T>(parser: Parser<T>) => Parser<T[]>;
export const many: Many = (parser) =>
  (state) => {
    const result = [];
    let parseResult;
    [parseResult, state] = parser(state);

    while (parseResult !== null) {
      result.push(parseResult);

      ([parseResult, state] = parser(state));
    }

    return [result, state];
  };

export type OneOrMore = <T>(parser: Parser<T>) => Parser<T[]>;
export const oneOrMore: OneOrMore = (parser) =>
  (state) => {
    const [result, newState] = many(parser)(state);

    if (result?.length !== 0) {
      return [result, newState];
    }

    return [null, state];
  };

export type Or = <T, K>(left: Parser<T>, right: Parser<K>) => Parser<T | K>;
export const or: Or = (left, right) =>
  (state) => {
    let [result, newState] = left(state);

    if (result !== null) {
      return [result, newState];
    }

    return right(state);
  };

export const regexp = createParser((p: RegExp, c) => p.test(c));

export const char = createParser((p: string, c) => p === c);

export const chars = (cs: string) =>
  seq((emit) => cs.split("").reduce((r, c) => r + emit(char(c)), ""));
