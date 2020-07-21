import { Expr, NumLit, BinPlusOp } from "./ast.ts";

type StateProps = {
  source?: string;
  location?: number;
  line?: number;
};

export class State {
  source: string;
  location: number;
  line: number;

  static from(source: string): State {
    return new State({ source });
  }

  constructor({ source, location, line }: StateProps = {}) {
    this.source = source || "";
    this.location = location || 0;
    this.line = line || 0;
  }

  peek(): string {
    return this.source[this.location];
  }

  nextChar(): State {
    this.location += 1;
    return this;
  }

  nextLine(): State {
    this.line += 1;
    return this;
  }

  clone(): State {
    return new State({ ...this });
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

    if (parser.done) {
      throw new Error();
    }

    do {
      let [result, newState] = parser.value(state);

      if (result === null) {
        return [null, state];
      }

      state = newState;
      parser = iter.next(result);
    } while (!parser.done);

    return [parser.value, state];
  };

export type CreateParser = (regexp: RegExp) => Parser<string>;
export const createParser: CreateParser = (regexp) =>
  (state) => {
    const char = state.peek();

    if (regexp.test(char)) {
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

export const whitespace = mapState(
  createParser(/\s/),
  (c, s) => c === "\n" ? s.nextLine() : s,
);

export const number = map(
  many(numeric),
  (chars) => new NumLit(+chars.join("")),
);

export const skip = map(many(whitespace), Expr.from);

export const binaryPlusExpr: ReturnType<typeof seq> = seq(function* () {
  yield skip;
  const left = yield number;
  yield skip;
  yield plus;
  yield skip;
  const right = yield or(binaryPlusExpr, number);
  return new BinPlusOp(left, right);
});
