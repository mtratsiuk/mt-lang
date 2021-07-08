import { pass } from "../utils/mod.ts";

import {
  BoolLit,
  Call,
  Expr,
  ExprVisitor,
  Identifier,
  NumLit,
  StrLit,
  UnaryMinusOp,
  UnaryNotOp,
} from "./ast.ts";

export type Compile = (value: Expr) => string;
export const compile: Compile = (value) => Compiler.compile(value);

export class Compiler implements ExprVisitor<string> {
  static compile(value: Expr): string {
    return value.accept(new Compiler());
  }

  compile(value: Expr): string {
    return value.accept(this);
  }

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
    return `${this.compile(callee)}(${
      args.map((a) => this.compile(a)).join(", ")
    })`;
  }

  visitUnaryNotOp({ value }: UnaryNotOp): string {
    return `!${this.compile(value)}`;
  }

  visitUnaryMinusOp({ value }: UnaryMinusOp): string {
    return `-${this.compile(value)}`;
  }
}
