import { EOF } from "./parser-state.ts";

import {
  char,
  chars,
  createParser,
  many,
  map,
  mapError,
  oneOrMore,
  or,
  Parser,
  regexp,
  seq,
} from "./parser-combinators.ts";

import {
  BinaryOp,
  BoolLit,
  Call,
  Expr,
  FunctionDecl,
  Identifier,
  NumLit,
  Print,
  StrLit,
  UnaryMinusOp,
  UnaryNotOp,
  VariableDecl,
} from "./ast.ts";

import { binaryOps, isKeyword, Keywords } from "./keywords.ts";

import { cnst } from "../utils/mod.ts";

export const eof = createParser((_: void, c) => c === EOF)(void 0);

export const whitespace = regexp(/\s/);

export const skip = many(whitespace);

export const numeric = regexp(/[0-9]/);

export const alpha = regexp(/[a-zA-Z]/);

export const alphaNumeric = or(numeric, alpha);

export const def = chars(Keywords.DEFINE);

export const identifier = seq((emit) => {
  const name = emit(
    oneOrMore(or(alphaNumeric, char("_"))),
  ).join("");

  if (isKeyword(name)) {
    emit(null);
  }

  return new Identifier(name);
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

export const binaryOpsP = binaryOps.map(chars).reduce(or);

export const binary = seq((emit) => {
  emit(char("("));

  const op = emit(binaryOpsP);
  emit(skip);
  const left = emit(expression, "Expected first operand");
  emit(skip);
  const right = emit(expression, "Expected second operand");

  emit(char(")"), "Expected `)` closing binary operation call");

  return new BinaryOp(op, left, right);
});

export const call = seq((emit) => {
  emit(char("("));

  const callee = emit(expression, "Expected expression after `(`");

  const args = emit(
    many(
      seq((emit) => {
        emit(skip);
        return emit(expression);
      }),
    ),
  );

  emit(char(")"), "Expected `)` closing function call");

  return new Call(callee, args);
});

export const print = seq((emit) => {
  emit(char("("));
  emit(chars(Keywords.PRINT));
  emit(skip);

  const value = emit(expression, "Expected expression to print");

  emit(char(")"), "Expected `)` closing print call");

  return new Print(value);
});

export const variableDecl = seq((emit) => {
  emit(char("("));
  emit(def);
  emit(skip);

  const id = emit(identifier);
  emit(skip);
  const expr = emit(expression, "Expected expression");
  emit(char(")"), "Expected `)` closing variable declaration");

  return new VariableDecl(id.name, expr);
});

export const functionDecl = seq((emit) => {
  emit(char("("));
  emit(def);
  emit(skip);

  emit(char("("));
  const id = emit(identifier, "Expected identifier");

  const params = emit(
    many(
      mapError(
        seq((emit) => {
          emit(skip);
          return emit(identifier);
        }),
        cnst(""),
        ((id) => id.name),
      ),
    ),
  );

  emit(char(")"), "Expected `)` after parameters list");
  emit(skip);
  const body = emit(oneOrMore(statement), "Expected a statement");
  emit(char(")"), "Expected `)` closing function declaration");

  return new FunctionDecl(id.name, params, body);
});

export const primary = or(
  number,
  or(string, or(boolean, or(identifier, or(binary, call)))),
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

export const statement: Parser<Expr> = seq((emit) => {
  emit(skip);
  const expr = emit(or(variableDecl, or(functionDecl, or(print, expression))));

  return expr;
});

export const mtlang = map(
  seq((emit) => {
    const stmts = emit(oneOrMore(statement), "Expected a statement");
    emit(skip);
    return stmts;
  }),
  (stmts) => Array.isArray(stmts) ? stmts : [stmts],
);
