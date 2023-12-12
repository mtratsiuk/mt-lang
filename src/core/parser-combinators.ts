import { id } from "../utils/mod.ts";
import * as Ast from "./ast.ts";
import { EOF, State } from "./parser-state.ts";

const DEBUG = Deno.args.includes("--debug");
const TAP_LOOKAHEAD = 20;

export type Parser<T> = (state: State) => [T | null, State];

export type PT<T> = T extends Parser<(infer K) | Ast.ParseError> ? K
  : T extends Parser<infer K> ? K
  : never;

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
export class SeqErrorSignal {
  constructor(
    public message: string,
    public line: number,
    public start: number,
    public end: number,
  ) {}
}
export class SeqDeepErrorSignal {
  constructor(public error: Ast.ParseError, public state: State) {}
}
export type EmitParser = <T>(
  p: Parser<T | Ast.ParseError> | null,
  e?: string,
) => T;
export type GetState = () => State;

export const createEmitParser: (state: State) => [EmitParser, GetState] = (
  state,
) => {
  const startPosition = state.locationInLine;
  let currentState = state;

  const emitParser: EmitParser = (parser, error) => {
    if (parser === null) {
      throw new SeqBreakSignal();
    }

    const [result, newState] = parser(currentState);

    if (result instanceof Ast.ParseError) {
      throw new SeqDeepErrorSignal(result, newState);
    }

    if (result === null) {
      if (error) {
        throw new SeqErrorSignal(
          error,
          currentState.line,
          startPosition,
          currentState.locationInLine,
        );
      }

      throw new SeqBreakSignal();
    }

    currentState = newState;

    return result;
  };

  return [emitParser, () => currentState];
};

export type Seq = <R>(
  seq: (emit: EmitParser) => R,
) => Parser<R | Ast.ParseError>;
export const seq: Seq = (sequence) => (state) => {
  const [emit, getState] = createEmitParser(state);

  try {
    const result = sequence(emit);

    return [result, getState()];
  } catch (signal) {
    if (signal instanceof SeqBreakSignal) {
      return [null, state];
    }

    if (signal instanceof SeqErrorSignal) {
      const err = new Ast.ParseError(
        signal.message,
        signal.line,
        signal.start,
        signal.end,
      );
      return [err, state.clone().error(err).synchronize()];
    }

    if (signal instanceof SeqDeepErrorSignal) {
      return [signal.error, signal.state];
    }

    throw signal;
  }
};

export type CreateParser = <T>(
  test: (param: T, char: string) => boolean,
) => (param: T) => Parser<string>;
export const createParser: CreateParser = (test) => (param) => (state) => {
  const char = state.peek();

  if (!test(param, char)) {
    return [null, state];
  }

  return [char, state.clone().nextChar()];
};

export type Map = <T, K>(parser: Parser<T>, f: (x: T) => K) => Parser<K>;
export const map: Map = (parser, f) => (state) => {
  const [result, newState] = parser(state);

  if (result === null) {
    return [null, state];
  }

  return [f(result), newState];
};

export type MapError = <T, K>(
  parser: Parser<T | Ast.ParseError>,
  mapE: (x: Ast.ParseError) => K,
  mapV: (x: T) => K,
) => Parser<K>;
export const mapError: MapError = (parser, mapE, mapV) => (state) => {
  const [result, newState] = parser(state);

  if (result === null) {
    return [null, state];
  }

  if (result instanceof Ast.ParseError) {
    return [mapE(result), newState];
  }

  return [mapV(result), newState];
};

export type MapState = <T>(
  parser: Parser<T>,
  f: (x: T, s: State) => State,
) => Parser<T>;
export const mapState: MapState = (parser, f) => (state) => {
  const [result, newState] = parser(state);

  if (result === null) {
    return [null, state];
  }

  return [result, f(result, newState.clone())];
};

export type Many = <T>(parser: Parser<T>) => Parser<T[]>;
export const many: Many = (parser) => (state) => {
  const result = [];
  let parseResult;

  for (;;) {
    [parseResult, state] = parser(state);

    if (parseResult !== null) {
      result.push(parseResult);
    }

    if (parseResult === null || state.isAtEnd()) {
      break;
    }
  }

  return [result, state];
};

export type OneOrMore = <T>(parser: Parser<T>) => Parser<T[]>;
export const oneOrMore: OneOrMore = (parser) => (state) => {
  const [result, newState] = many(parser)(state);

  if (result?.length !== 0) {
    return [result, newState];
  }

  return [null, state];
};

export type Or = <T, K>(left: Parser<T>, right: Parser<K>) => Parser<T | K>;
export const or: Or = (left, right) => (state) => {
  const [result, newState] = left(state);

  if (result !== null) {
    return [result, newState];
  }

  return right(state);
};

export type Optional = <T>(parser: Parser<T>) => Parser<T | undefined>;
export const optional: Optional = (parser) => (state) => {
  const [result, newState] = parser(state);

  if (result === null) {
    return [undefined, newState];
  }

  return [result, newState];
};

export const regexp = createParser((p: RegExp, c) => c !== EOF && p.test(c));

export const char = createParser((p: string, c) => c !== EOF && p === c);

export const chars = (cs: string) =>
  seq((emit) => cs.split("").reduce((r, c) => r + emit(char(c)), ""));

let ident = -1;

export type Tap = (name: string) => <T>(parser: Parser<T>) => Parser<T>;
export const tap: Tap = (name) =>
  !DEBUG ? id : (parser) => (state) => {
    const incomingChars = state.source.slice(
      state.location,
      state.location + TAP_LOOKAHEAD,
    );

    try {
      ident += 1;

      console.log(
        `${
          " ".repeat(ident)
        }[${ident}][l: ${state.line}, p: ${state.locationInLine}]: ${name} <~~ ${incomingChars}`,
      );

      const [result, nextState] = parser(state);

      console.log(`${" ".repeat(ident)}[${ident}] > `, result);

      return [result, nextState];
    } finally {
      ident -= 1;
    }
  };
