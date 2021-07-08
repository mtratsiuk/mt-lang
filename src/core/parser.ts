import { EOF } from "./parser-state.ts";

import {
  char,
  chars,
  createParser,
  many,
  map,
  oneOrMore,
  or,
  Parser,
  regexp,
  seq,
} from "./parser-combinators.ts";

import {
  BoolLit,
  Call,
  Expr,
  Identifier,
  NumLit,
  StrLit,
  UnaryMinusOp,
  UnaryNotOp,
} from "./ast.ts";

import { cnst } from "../utils/mod.ts";

export const eof = createParser((_: void, c) => c === EOF)(void 0);

export const semi = char(";");

export const whitespace = regexp(/\s/);

export const skip = many(whitespace);

export const numeric = regexp(/[0-9]/);

export const alpha = regexp(/[a-zA-Z]/);

export const alphaNumeric = or(numeric, alpha);

export const identifier = seq((emit) => {
  const firstChar = emit(alpha);
  const rest = emit(many(or(alphaNumeric, char("-"))));

  return new Identifier(firstChar + rest.join(""));
});

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

export const boolean = or(
  map(chars("true"), cnst(new BoolLit(true))),
  map(chars("false"), cnst(new BoolLit(false))),
);

export const call = seq((emit) => {
  emit(char("("));

  const callee = emit(expression, "Expected expression after `(`");

  const args = emit(
    oneOrMore(
      seq((emit) => {
        emit(skip);
        return emit(expression);
      }),
    ),
    "Expected arguments",
  );

  emit(char(")"), "Expected `)` closing function call");

  return new Call(callee, args);
});

export const primary = or(
  number,
  or(string, or(boolean, or(identifier, call))),
);

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

export const expression = unary;

export const statement = (seq((emit) => {
  emit(skip);
  const expr = emit(call);
  emit(skip);

  return expr;
}));

export const mtlang = map(
  seq((emit) => {
    const stmts = emit(oneOrMore(statement), "Expected a statement");
    emit(eof, "Expected end of file");
    return stmts;
  }),
  (stmts) => Array.isArray(stmts) ? stmts : [stmts],
);
