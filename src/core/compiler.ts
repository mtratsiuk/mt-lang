import { pass } from "../utils/mod.ts";

import * as Ast from "./ast.ts";
import { BinaryOps } from "./keywords.ts";

const IDENT = 2;

export type Compile = (value: Ast.Expr | Ast.Expr[]) => string;
export const compile: Compile = (value) => {
  if (!Array.isArray(value)) {
    value = [value];
  }

  return value.map(Compiler.compile).join(";\n\n") + ";";
};

export class Compiler implements Ast.ExprVisitor<string> {
  _depth = 0;

  static compile(value: Ast.Expr): string {
    return value.accept(new Compiler());
  }

  compile = (value: Ast.Expr): string => {
    return value.accept(this);
  };

  visitParseError = pass;

  visitNumLit({ value }: Ast.NumLit): string {
    return String(value);
  }

  visitStrLit({ value }: Ast.StrLit): string {
    return `"${value}"`;
  }

  visitBoolLit({ value }: Ast.BoolLit): string {
    return String(value);
  }

  visitIdentifier({ name }: Ast.Identifier): string {
    return name;
  }

  visitCall({ callee, args }: Ast.Call): string {
    return `${this.compile(callee)}(${args.map(this.compile).join(", ")})`;
  }

  visitPrint({ value }: Ast.Print): string {
    return `console.log(String(${this.compile(value)}))`;
  }

  visitBinaryOp({ op, left, right }: Ast.BinaryOp): string {
    return `(${this.compile(left)} ${BinaryOps[op]} ${this.compile(right)})`;
  }

  visitUnaryNotOp({ value }: Ast.UnaryNotOp): string {
    return `!${this.compile(value)}`;
  }

  visitUnaryMinusOp({ value }: Ast.UnaryMinusOp): string {
    return `-${this.compile(value)}`;
  }

  visitVariableDecl({ name, value }: Ast.VariableDecl): string {
    return `const ${name} = ${this.compile(value)}`;
  }

  visitBlock({ body }: Ast.Block): string {
    return this._withIdent((ident) => {
      return `\
{\
${body.slice(0, -1).map((expr) => `${ident}${this.compile(expr)};`).join("")}\
${body.slice(-1).map((expr) => `${ident}return ${this.compile(expr)};`)}\
\n}`;
    });
  }

  visitFunctionDecl({ name, params, body }: Ast.FunctionDecl): string {
    return `function ${name}(${params.join(", ")}) ${this.compile(body)}`;
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
