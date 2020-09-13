import { ParseError } from "./ast.ts";

export const EOF = "EOF";

type StateProps = {
  source?: string;
  location?: number;
  line?: number;
  errors?: ParseError[];
};

export class State {
  source: string;
  location: number;
  line: number;
  errors: ParseError[];

  static from(source: string): State {
    return new State({ source });
  }

  constructor({ source, location, line, errors }: StateProps = {}) {
    this.source = source || "";
    this.location = location || 0;
    this.line = line || 0;
    this.errors = errors || [];
  }

  peek(): string {
    if (this.location >= this.source.length) {
      return EOF;
    }

    return this.source[this.location];
  }

  nextChar(): State {
    if (this.peek() === "\n") {
      this.nextLine();
    }

    if (this.isAtEnd()) {
      return this;
    }

    this.location += 1;

    return this;
  }

  nextLine(): State {
    this.line += 1;
    return this;
  }

  error(err: ParseError): State {
    this.errors.push(err);
    return this;
  }

  synchronize(): State {
    while (![";", EOF].includes(this.peek())) {
      this.nextChar();
    }

    return this.nextChar();
  }

  isAtEnd(): boolean {
    return this.location >= this.source.length;
  }

  clone(): State {
    return new State({ ...this });
  }
}
