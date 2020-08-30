import {
  ExprVisitor,
  NumLit,
  StrLit,
  BoolLit,
  UnaryNotOp,
  UnaryMinusOp,
  Grouping,
  BinPlusOp,
  BinMinusOp,
  BinMultOp,
  BinDivOp,
  BinMoreThanOp,
  BinMoreThanOrEqOp,
  BinLessThanOp,
  BinLessThanOrEqOp,
  BinEqOp,
  BinNotEqOp,
  Expr,
} from "./ast.ts";

export class Compiler implements ExprVisitor<string> {
  static compile(value: Expr): string {
    return value.accept(new Compiler());
  }

  compile(value: Expr): string {
    return value.accept(this);
  }

  visitNumLit({ value }: NumLit): string {
    return String(value);
  }

  visitStrLit({ value }: StrLit): string {
    return value;
  }

  visitBoolLit({ value }: BoolLit): string {
    return String(value);
  }

  visitUnaryNotOp({ value }: UnaryNotOp): string {
    return `!${this.compile(value)}`;
  }

  visitUnaryMinusOp({ value }: UnaryMinusOp): string {
    return `-${this.compile(value)}`;
  }

  visitGrouping({ expr }: Grouping): string {
    return `(${this.compile(expr)})`;
  }

  visitBinPlusOp({ left, right }: BinPlusOp): string {
    return `${this.compile(left)} + ${this.compile(right)}`;
  }

  visitBinMinusOp({ left, right }: BinMinusOp): string {
    return `${this.compile(left)} - ${this.compile(right)}`;
  }

  visitBinMultOp({ left, right }: BinMultOp): string {
    return `${this.compile(left)} * ${this.compile(right)}`;
  }

  visitBinDivOp({ left, right }: BinDivOp): string {
    return `${this.compile(left)} / ${this.compile(right)}`;
  }

  visitBinMoreThanOp({ left, right }: BinMoreThanOp): string {
    return `${this.compile(left)} > ${this.compile(right)}`;
  }

  visitBinMoreThanOrEqOp({ left, right }: BinMoreThanOrEqOp): string {
    return `${this.compile(left)} >= ${this.compile(right)}`;
  }

  visitBinLessThanOp({ left, right }: BinLessThanOp): string {
    return `${this.compile(left)} < ${this.compile(right)}`;
  }

  visitBinLessThanOrEqOp({ left, right }: BinLessThanOrEqOp): string {
    return `${this.compile(left)} <= ${this.compile(right)}`;
  }

  visitBinEqOp({ left, right }: BinEqOp): string {
    return `${this.compile(left)} === ${this.compile(right)}`;
  }

  visitBinNotEqOp({ left, right }: BinNotEqOp): string {
    return `${this.compile(left)} !== ${this.compile(right)}`;
  }
}
