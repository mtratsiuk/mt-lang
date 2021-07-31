import { cnst } from "../utils/mod.ts";

import * as P from "./parser-combinators.ts";
import * as Ast from "./ast.ts";
import { binaryOps, isKeyword, Keywords } from "./keywords.ts";
import { EOF } from "./parser-state.ts";

export const eof = P.createParser((_: void, c) => c === EOF)(void 0);

export const whitespace = P.regexp(/\s/);

export const skip = P.many(whitespace);

export const numeric = P.regexp(/[0-9]/);

export const alpha = P.regexp(/[a-zA-Z]/);

export const alphaNumeric = P.or(numeric, alpha);

export const def = P.chars(Keywords.DEFINE);

export const identifier = P.seq((emit) => {
  const name = emit(
    P.oneOrMore(P.or(alphaNumeric, P.char("_"))),
  ).join("");

  if (isKeyword(name)) {
    emit(null);
  }

  return new Ast.Identifier(name);
});

export const number = P.map(
  P.oneOrMore(P.regexp(/[0-9]/)),
  (chars) => new Ast.NumLit(+chars.join("")),
);

export const string = P.seq((emit) => {
  emit(P.char('"'));
  const chars = emit(P.many(P.regexp(/[^"\n]/)));
  emit(P.char('"'), 'Expected `"` terminating a string');
  return new Ast.StrLit(chars.join(""));
});

export const boolean = P.or(
  P.map(P.chars("true"), cnst(new Ast.BoolLit(true))),
  P.map(P.chars("false"), cnst(new Ast.BoolLit(false))),
);

export const binaryOpsP = binaryOps.map(P.chars).reduce(P.or);

export const binary = P.seq((emit) => {
  emit(P.char("("));

  const op = emit(binaryOpsP);
  emit(skip);
  const left = emit(expression, "Expected first operand");
  emit(skip);
  const right = emit(expression, "Expected second operand");

  emit(P.char(")"), "Expected `)` closing binary operation call");

  return new Ast.BinaryOp(op, left, right);
});

export const call = P.seq((emit) => {
  emit(P.char("("));

  const callee = emit(expression, "Expected expression after `(`");

  const args = emit(
    P.many(
      P.seq((emit) => {
        emit(skip);
        return emit(expression);
      }),
    ),
  );

  emit(P.char(")"), "Expected `)` closing function call");

  return new Ast.Call(callee, args);
});

export const print = P.seq((emit) => {
  emit(P.char("("));
  emit(P.chars(Keywords.PRINT));
  emit(skip);

  const value = emit(expression, "Expected expression to print");

  emit(P.char(")"), "Expected `)` closing print call");

  return new Ast.Print(value);
});

export const variableDecl = P.seq((emit) => {
  emit(P.char("("));
  emit(def);
  emit(skip);

  const id = emit(identifier);
  emit(skip);
  const expr = emit(expression, "Expected expression");
  emit(P.char(")"), "Expected `)` closing variable declaration");

  return new Ast.VariableDecl(id.name, expr);
});

export const functionDecl = P.seq((emit) => {
  emit(P.char("("));
  emit(def);
  emit(skip);

  emit(P.char("("));
  const id = emit(identifier, "Expected identifier");

  const params = emit(
    P.many(
      P.mapError(
        P.seq((emit) => {
          emit(skip);
          return emit(identifier);
        }),
        cnst(""),
        ((id) => id.name),
      ),
    ),
  );

  emit(P.char(")"), "Expected `)` after parameters list");
  emit(skip);
  const body = emit(P.oneOrMore(statement), "Expected a statement");
  emit(P.char(")"), "Expected `)` closing function declaration");

  return new Ast.FunctionDecl(id.name, params, new Ast.Block(body));
});

export const primary = P.or(
  number,
  P.or(string, P.or(boolean, P.or(identifier, P.or(binary, call)))),
);

export const unary: P.Parser<Ast.Expr> = P.or(
  P.seq((emit) => {
    const not = P.map(P.char("!"), cnst(Ast.UnaryNotOp));
    const minus = P.map(P.char("-"), cnst(Ast.UnaryMinusOp));

    const Op = emit(P.or(not, minus));
    const expr = emit(unary);

    return new Op(expr);
  }),
  primary,
);

export const expression = unary;

export const statement: P.Parser<Ast.Expr> = P.seq((emit) => {
  emit(skip);

  const expr = emit(
    P.or(variableDecl, P.or(functionDecl, P.or(print, expression))),
  );

  return expr;
});

export const mtlang = P.map(
  P.seq((emit) => {
    const stmts = emit(P.oneOrMore(statement), "Expected a statement");
    emit(skip);
    return stmts;
  }),
  (stmts) => Array.isArray(stmts) ? stmts : [stmts],
);
