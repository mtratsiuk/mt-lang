import { Expr, NumberLiteral, BinPlusOp } from "./ast.ts";

type StateProps = {
  source?: string;
  location?: number;
};

export class State {
  source: string;
  location: number;
  line: number;

  static from(source: string): State {
    return new State({ source });
  }

  constructor({ source, location }: StateProps = {}) {
    this.source = source || "";
    this.location = location || 0;
    this.line = 0;
  }

  peek(n: number = 0): string {
    return this.source[this.location + n];
  }

  advance(n: number): State {
    return this.clone({ location: this.location + n });
  }

  clone(state: Partial<State>): State {
    return new State({ ...this, ...state });
  }
}

type Parser<T> = (state: State) => [T | null, State];

type PT<T> = T extends Parser<infer K> ? K : T;

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

export type Seq = <T, R>(
  sequence: () => Generator<Parser<T>, R, T>,
) => Parser<R>;
export const seq: Seq = (sequence) =>
  (state) => {
    const iter = sequence();
    let parser = iter.next();
    let result;
    let newState = state;

    if (parser.done) {
      throw new Error();
    }

    do {
      ([result, newState] = parser.value(newState));

      if (result === null) {
        return [null, state];
      }

      parser = iter.next(result);
    } while (!parser.done);

    return [parser.value, newState];
  };

export type CreateParser = (regexp: RegExp) => Parser<string>;
export const createParser: CreateParser = (regexp) =>
  (state) => {
    const char = state.peek();

    if (regexp.test(char)) {
      return [char, state.advance(1)];
    }

    return [null, state];
  };

export type FMap = <T, K>(parser: Parser<T>, f: (x: T) => K) => Parser<K>;
export const fmap: FMap = (parser, f) =>
  (state) => {
    const [result, newState] = parser(state);

    if (result === null) {
      return [null, newState];
    }

    return [f(result), newState];
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

export type Or = <T, K>(left: Parser<T>, right: Parser<K>) => Parser<T | K>;
export const or: Or = (left, right) =>
  (state) => {
    let [result, newState] = left(state);

    if (result !== null) {
      return [result, newState];
    }

    return right(state);
  };

export const numeric = createParser(/[0-9]/);

export const alpha = createParser(/[a-zA-Z]/);

export const plus = createParser(/\+/);

export const whitespace = createParser(/\s/);

export const number = fmap(
  many(numeric),
  (chars) => new NumberLiteral(+chars.join("")),
);

export const skip = fmap(many(whitespace), Expr.from);

export const binaryPlusExpr: ReturnType<typeof seq> = seq(function* () {
  yield skip;
  const left = yield number;
  yield skip;
  yield plus;
  yield skip;
  const right = yield or(binaryPlusExpr, number);
  yield skip;
  return new BinPlusOp(left, right);
});
