export class Expr {
  static from() {
    return new Expr();
  }
}

export class Stmt {}

export class NumberLiteral extends Expr {
  constructor(public value: number) {
    super();
  }
}

export class BinPlusOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }
}
