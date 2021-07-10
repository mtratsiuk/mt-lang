import { pass } from "../utils/mod.ts";

import {
  BoolLit,
  Call,
  Expr,
  ExprVisitor,
  FunctionDecl,
  Identifier,
  NumLit,
  StrLit,
  UnaryMinusOp,
  UnaryNotOp,
  VariableDecl,
} from "./ast.ts";

const IDENT = 2;

export type Compile = (value: Expr) => string;
export const compile: Compile = (value) => Compiler.compile(value);

export class Compiler implements ExprVisitor<string> {
  _depth = 0;

  static compile(value: Expr): string {
    return value.accept(new Compiler());
  }

  compile = (value: Expr): string => {
    return value.accept(this);
  };

  visitParseError = pass;

  visitNumLit({ value }: NumLit): string {
    return String(value);
  }

  visitStrLit({ value }: StrLit): string {
    return `"${value}"`;
  }

  visitBoolLit({ value }: BoolLit): string {
    return String(value);
  }

  visitIdentifier({ name }: Identifier): string {
    return name;
  }

  visitCall({ callee, args }: Call): string {
    return `${this.compile(callee)}(${args.map(this.compile).join(", ")})`;
  }

  visitUnaryNotOp({ value }: UnaryNotOp): string {
    return `!${this.compile(value)}`;
  }

  visitUnaryMinusOp({ value }: UnaryMinusOp): string {
    return `-${this.compile(value)}`;
  }

  visitVariableDecl({ name, value }: VariableDecl): string {
    return `const ${name} = ${this.compile(value)};`;
  }

  visitFunctionDecl({ name, params, body }: FunctionDecl): string {
    return this._withIdent((ident) => {
      return `\
function ${name}(${params.join(", ")}) {\
${body.slice(0, -1).map((expr) => `${ident}${this.compile(expr)};`).join("")}\
${body.slice(-1).map((expr) => `${ident}return ${this.compile(expr)};`)}\
\n}`;
    });
  }

  _withIdent(compile: (ident: string) => string): string {
    try {
      this._depth += 1;

      return compile("\n" + " ".repeat(IDENT * this._depth));
    } finally {
      this._depth -= 1;
    }
  }
}
