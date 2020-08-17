/* Generated code */

export type ExprVisitor<T> = {
  visitNumLit(value: NumLit): T;
  visitStrLit(value: StrLit): T;
  visitBoolLit(value: BoolLit): T;
  visitBinPlusOp(value: BinPlusOp): T;
  visitBinMinusOp(value: BinMinusOp): T;
  visitBinMultOp(value: BinMultOp): T;
  visitBinDivOp(value: BinDivOp): T;
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
