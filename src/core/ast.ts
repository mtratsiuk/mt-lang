/* Generated code */

export type ExprVisitor<T> = {
  visitNumLit(value: NumLit): T;
  visitStrLit(value: StrLit): T;
  visitBoolLit(value: BoolLit): T;
  visitUnaryNotOp(value: UnaryNotOp): T;
  visitUnaryMinusOp(value: UnaryMinusOp): T;
  visitGrouping(value: Grouping): T;
  visitParseError(value: ParseError): T;
  visitBinPlusOp(value: BinPlusOp): T;
  visitBinMinusOp(value: BinMinusOp): T;
  visitBinMultOp(value: BinMultOp): T;
  visitBinDivOp(value: BinDivOp): T;
  visitBinMoreThanOp(value: BinMoreThanOp): T;
  visitBinMoreThanOrEqOp(value: BinMoreThanOrEqOp): T;
  visitBinLessThanOp(value: BinLessThanOp): T;
  visitBinLessThanOrEqOp(value: BinLessThanOrEqOp): T;
  visitBinEqOp(value: BinEqOp): T;
  visitBinNotEqOp(value: BinNotEqOp): T;
};

export class Expr {
  accept<T>(visitor: ExprVisitor<T>): T {
    throw new Error("not implemented");
  }
}

export class NumLit extends Expr {
  constructor(public value: number) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitNumLit(this);
  }
}

export class StrLit extends Expr {
  constructor(public value: string) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitStrLit(this);
  }
}

export class BoolLit extends Expr {
  constructor(public value: boolean) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBoolLit(this);
  }
}

export class UnaryNotOp extends Expr {
  constructor(public value: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitUnaryNotOp(this);
  }
}

export class UnaryMinusOp extends Expr {
  constructor(public value: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitUnaryMinusOp(this);
  }
}

export class Grouping extends Expr {
  constructor(public expr: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitGrouping(this);
  }
}

export class ParseError extends Expr {
  constructor(public message: string) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitParseError(this);
  }
}

export class BinPlusOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinPlusOp(this);
  }
}

export class BinMinusOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinMinusOp(this);
  }
}

export class BinMultOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinMultOp(this);
  }
}

export class BinDivOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinDivOp(this);
  }
}

export class BinMoreThanOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinMoreThanOp(this);
  }
}

export class BinMoreThanOrEqOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinMoreThanOrEqOp(this);
  }
}

export class BinLessThanOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinLessThanOp(this);
  }
}

export class BinLessThanOrEqOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinLessThanOrEqOp(this);
  }
}

export class BinEqOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinEqOp(this);
  }
}

export class BinNotEqOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinNotEqOp(this);
  }
}
