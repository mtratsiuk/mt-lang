import { Expr, NumLit, BinPlusOp, StrLit } from "./ast.ts";

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

export const numeric = regexp(/[0-9]/);

export const alpha = regexp(/[a-zA-Z]/);

export const plus = regexp(/\+/);

export const whitespace = mapState(
  regexp(/\s/),
  (c, s) => c === "\n" ? s.nextLine() : s,
);

export const number = map(
  oneOrMore(numeric),
  (chars) => new NumLit(+chars.join("")),
);

export const string = seq((emit) => {
  emit(char('"'));
  const chars = emit(many(regexp(/[^"\n]/)));
  emit(char('"'));
  return new StrLit(chars.join(""));
});

export const skip = map(many(whitespace), () => new Expr());

export const binaryPlusExpr: Parser<BinPlusOp> = seq((emit) => {
  emit(skip);
  const left = emit(number);
  emit(skip);
  emit(plus);
  emit(skip);
  const right = emit(or(binaryPlusExpr, number));
  return new BinPlusOp(left, right);
});
