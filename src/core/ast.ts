/* Generated code */

export type ExprVisitor<T> = {
  visitNumLit(value: NumLit): T;
  visitStrLit(value: StrLit): T;
  visitBoolLit(value: BoolLit): T;
  visitIdentifier(value: Identifier): T;
  visitCall(value: Call): T;
  visitUnaryNotOp(value: UnaryNotOp): T;
  visitUnaryMinusOp(value: UnaryMinusOp): T;
  visitParseError(value: ParseError): T;
  visitVariableDecl(value: VariableDecl): T;
  visitFunctionDecl(value: FunctionDecl): T;
};

export class Expr {
  accept<T>(_visitor: ExprVisitor<T>): T {
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

export class Identifier extends Expr {
  constructor(public name: string) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitIdentifier(this);
  }
}

export class Call extends Expr {
  constructor(public callee: Expr, public args: Expr[]) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitCall(this);
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

export class ParseError extends Expr {
  constructor(public message: string) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitParseError(this);
  }
}

export class VariableDecl extends Expr {
  constructor(public name: string, public value: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitVariableDecl(this);
  }
}

export class FunctionDecl extends Expr {
  constructor(
    public name: string,
    public params: string[],
    public body: Expr[],
  ) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitFunctionDecl(this);
  }
}
