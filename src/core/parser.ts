import { EOF } from "./parser-state.ts";

import {
  regexp,
  many,
  map,
  oneOrMore,
  seq,
  char,
  or,
  chars,
  Parser,
} from "./parser-combinators.ts";

import {
  Expr,
  NumLit,
  BinPlusOp,
  StrLit,
  BoolLit,
  Grouping,
  UnaryNotOp,
  UnaryMinusOp,
  BinDivOp,
  BinMultOp,
  BinMinusOp,
  BinMoreThanOrEqOp,
  BinMoreThanOp,
  BinLessThanOrEqOp,
  BinLessThanOp,
  BinEqOp,
  BinNotEqOp,
  ParseError,
} from "./ast.ts";

import { id, cnst, isEmpty } from "../utils/mod.ts";

export type CreateBinaryOpParser = (
  operand: Parser<Expr>,
  ...operators: Parser<typeof BinPlusOp>[]
) => Parser<Expr>;
export const createBinaryOpParser: CreateBinaryOpParser = (
  operand,
  ...operators
) =>
  seq((emit) => {
    emit(skip);
    const left = emit(operand);
    emit(skip);

    const right = emit(many(seq((emit) => {
      const ops = operators.reduce(or);

      const op = emit(ops);
      emit(skip);
      const expr = emit(operand);
      emit(skip);

      return [op, expr] as [typeof op, typeof expr];
    })));

    if (isEmpty(right)) {
      return left;
    }

    return right.reduce((l, r) => {
      if (r instanceof ParseError) {
        return r;
      }

      const [Op, expr] = r;
      return new Op(l, expr);
    }, left);
  });

export const eof = char(EOF);

export const semi = char(";");

export const whitespace = regexp(/\s/);

export const skip = many(whitespace);

export const number = map(
  oneOrMore(regexp(/[0-9]/)),
  (chars) => new NumLit(+chars.join("")),
);

export const string = seq((emit) => {
  emit(char('"'));
  const chars = emit(many(regexp(/[^"\n]/)));
  emit(char('"'), 'Expected `"` terminating a string');
  return new StrLit(chars.join(""));
});

export const boolean = map(
  or(
    map(chars("true"), cnst(new BoolLit(true))),
    map(chars("false"), cnst(new BoolLit(false))),
  ),
  id,
);

export const grouping = seq((emit) => {
  emit(skip);
  emit(char("("));
  emit(skip);
  const expr = emit(expression, "Expected expression after `(`");
  emit(skip);
  emit(char(")"), "Expected `)` after expression");
  emit(skip);
  return new Grouping(expr);
});

export const primary = seq((emit) => {
  const prim = or(number, or(string, or(boolean, grouping)));
  return emit(prim, "Expected expression");
});

export const unary: Parser<Expr> = or(
  seq((emit) => {
    const not = map(char("!"), cnst(UnaryNotOp));
    const minus = map(char("-"), cnst(UnaryMinusOp));

    const Op = emit(or(not, minus));
    const expr = emit(unary);

    return new Op(expr);
  }),
  primary,
);

export const multiplication = createBinaryOpParser(
  unary,
  map(char("/"), cnst(BinDivOp)),
  map(char("*"), cnst(BinMultOp)),
);

export const addition = createBinaryOpParser(
  multiplication,
  map(char("+"), cnst(BinPlusOp)),
  map(char("-"), cnst(BinMinusOp)),
);

export const comparison = createBinaryOpParser(
  addition,
  map(chars(">="), cnst(BinMoreThanOrEqOp)),
  map(char(">"), cnst(BinMoreThanOp)),
  map(chars("<="), cnst(BinLessThanOrEqOp)),
  map(char("<"), cnst(BinLessThanOp)),
);

export const equality = createBinaryOpParser(
  comparison,
  map(chars("=="), cnst(BinEqOp)),
  map(chars("!="), cnst(BinNotEqOp)),
);

export const expression = equality;

export const expressionStmt = seq((emit) => {
  const expr = emit(expression);
  emit(semi, "Expected `;` after expression");
  return expr;
});

export const statements = many(expressionStmt);

export const mtlang = map(
  seq((emit) => {
    const stmts = emit(statements);
    emit(eof, "Expected end of file");
    return stmts;
  }),
  (stmts) => Array.isArray(stmts) ? stmts : [stmts],
);
