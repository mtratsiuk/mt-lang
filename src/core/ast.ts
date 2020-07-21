export class Expr {
  static from() {
    return new Expr();
  }
}

export class Stmt {}

export class NumLit extends Expr {
  constructor(public value: number) {
    super();
  }
}

export class StrLit extends Expr {
  constructor(public value: string) {
    super();
  }
}

export class BoolLit extends Expr {
  constructor(public value: boolean) {
    super();
  }
}

export class BinPlusOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }
}

export class BinMinusOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }
}

export class BinMultOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }
}

export class BinDivOp extends Expr {
  constructor(public left: Expr, public right: Expr) {
    super();
  }
}
