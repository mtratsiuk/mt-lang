import { cnst, id } from "../utils/mod.ts";

import * as P from "./parser-combinators.ts";
import * as Ast from "./ast.ts";
import { binaryOps, isKeyword, Keywords, unaryOps } from "./keywords.ts";
import { EOF } from "./parser-state.ts";

export const eof = P.createParser((_: void, c) => c === EOF)(void 0);

export const whitespace = P.regexp(/\s/);

export const skip = P.many(whitespace);

export const numeric = P.regexp(/[0-9]/);

export const alpha = P.regexp(/[a-zA-Z]/);

export const alphaNumeric = P.or(numeric, alpha);

export const def = P.chars(Keywords.DEFINE);

export const identifier = P.tap("identifier")(P.seq((emit) => {
  const name = emit(
    P.oneOrMore(P.or(alphaNumeric, P.char("_"))),
  ).join("");

  if (isKeyword(name)) {
    emit(null);
  }

  return new Ast.Identifier(name);
}));

export const numberPart: P.Parser<string[] | Ast.ParseError> = P.or(
  P.seq((emit) => {
    const head = emit(P.oneOrMore(numeric));
    const separator = emit(P.char("_"));
    const tail = emit(numberPart);

    return head.concat(separator, tail);
  }),
  P.oneOrMore(numeric),
);

export const number = P.tap("number")(
  P.seq((emit) => {
    const integer = emit(P.optional(numberPart)) ?? [];
    const point = emit(P.optional(P.map(P.char("."), (x) => [x]))) ?? [];
    const fraction = emit(P.optional(numberPart)) ?? [];

    const number = integer.concat(point, fraction).filter((x) => x !== "_");

    if (
      number.length === 0 ||
      (integer.length === 0 && fraction.length === 0)
    ) {
      emit(null);
    }

    return new Ast.NumLit(+number.join(""));
  }),
);

export const string = P.tap("string")(P.seq((emit) => {
  emit(P.char('"'));
  const chars = emit(P.many(P.regexp(/[^"\n]/)));
  emit(P.char('"'), 'Expected `"` terminating a string');
  return new Ast.StrLit(chars.join(""));
}));

export const boolean = P.tap("boolean")(P.or(
  P.map(P.chars("true"), cnst(new Ast.BoolLit(true))),
  P.map(P.chars("false"), cnst(new Ast.BoolLit(false))),
));

export const nil = P.tap("nil")(
  P.map(P.chars(Keywords.NIL), cnst(new Ast.NilLit())),
);

export const binaryOpsP = binaryOps.map(P.chars).reduce(P.or);

export const binary = P.tap("binary")(P.seq((emit) => {
  emit(P.char("("));

  const op = emit(binaryOpsP);
  emit(skip);
  const left = emit(expression, "Expected first operand");
  emit(skip);
  const right = emit(expression, "Expected second operand");

  emit(P.char(")"), "Expected `)` closing binary operation call");

  return new Ast.BinaryOp(op, left, right);
}));

export const call = P.tap("call")(P.seq((emit) => {
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
}));

export const methodCallChain = P.tap("methodCallChain")(P.seq((emit) => {
  emit(P.char("("));
  emit(P.chars("~>"));
  emit(skip);

  const receiver = emit(
    expression,
    "Expected expression as a method call chain receiver",
  );

  const calls = emit(
    P.oneOrMore(
      P.mapError(
        P.seq((emit) => {
          emit(skip);
          emit(P.chars("~>"));
          emit(skip);

          const target = emit(
            expression,
            "Expected expression as a target method to call",
          );

          const args = emit(
            P.many(
              P.seq((emit) => {
                emit(skip);
                return emit(expression);
              }),
            ),
          );

          return { target, args };
        }),
        (error) => ({ target: new Ast.Identifier("error"), args: [error] }),
        id,
      ),
    ),
  );

  emit(P.char(")"), "Expected `)` closing method call chain");

  return new Ast.MethodCallChain(receiver, calls);
}));

export const print = P.tap("print")(P.seq((emit) => {
  emit(P.char("("));
  emit(P.chars(Keywords.PRINT));
  emit(whitespace);
  emit(skip);

  const value = emit(expression, "Expected expression to print");

  emit(P.char(")"), "Expected `)` closing print call");

  return new Ast.Print(value);
}));

export const variableDecl = P.tap("variableDecl")(P.seq((emit) => {
  emit(P.char("("));
  emit(def);
  emit(skip);

  const id = emit(identifier);
  emit(skip);
  const expr = emit(expression, "Expected expression");
  emit(P.char(")"), "Expected `)` closing variable declaration");

  return new Ast.VariableDecl(id.name, expr);
}));

export const functionExpr = P.tap("functionExpr")(P.seq((emit) => {
  emit(P.char("("));
  emit(skip);

  emit(P.char("|"));
  const params = emit(
    P.many(
      P.mapError(
        P.seq((emit) => {
          emit(skip);
          return emit(identifier);
        }),
        cnst(""),
        (id) => id.name,
      ),
    ),
  );
  emit(P.char("|"), "Expected `|` after parameters list");

  emit(skip);
  const body = emit(P.oneOrMore(statement), "Expected a statement");
  emit(P.char(")"), "Expected `)` closing function expression");

  return new Ast.FunctionExpr(params, new Ast.Block(body));
}));

export const cond = P.tap("cond")(P.seq((emit) => {
  emit(P.char("("));
  emit(P.chars(Keywords.CONDITION));
  emit(skip);

  const branches = emit(
    P.oneOrMore(
      P.mapError(
        P.seq((emit) => {
          emit(skip);
          emit(P.char("("));

          const condition = emit(expression);

          const body = emit(
            P.oneOrMore(statement),
            "Expected a statement inside branch body",
          );

          emit(P.char(")"), "Expected `)` closing branch");

          return { condition, body: new Ast.Block(body) };
        }),
        (error) => ({ condition: error, body: new Ast.Block([]) }),
        id,
      ),
    ),
  );

  const elseBody = emit(
    P.optional(
      P.mapError(
        P.seq((emit) => {
          emit(skip);
          emit(P.char("("));
          emit(P.chars(Keywords.ELSE));

          const body = emit(
            P.oneOrMore(statement),
            "Expected a statement inside else body",
          );

          emit(P.char(")"), "Expected `)` closing else branch");

          return new Ast.Block(body);
        }),
        cnst(new Ast.Block([])),
        id,
      ),
    ),
  );

  emit(P.char(")"), "Expected `)` closing cond expression");

  return new Ast.Cond(branches, elseBody);
}));

export const array = P.tap("array")(P.seq((emit) => {
  emit(P.char("["));
  emit(skip);

  const items = emit(
    P.many(
      P.seq((emit) => {
        emit(skip);
        return emit(expression);
      }),
    ),
  );

  emit(skip);
  emit(P.char("]"), "Expected `]` closing array literal");

  return new Ast.ArrayLit(items);
}));

export const primary: P.Parser<Ast.Expr> = P.tap("primary")([
  nil,
  number,
  string,
  boolean,
  array,
  identifier,
  cond,
  functionExpr,
  binary,
  methodCallChain,
  call,
].reduce(P.or));

export const memberRec: P.Parser<Ast.Expr[] | Ast.ParseError> = P.seq(
  (emit) => {
    const target = emit(primary);
    emit(skip);

    const accessSeparator = emit(P.optional(P.char("/")));

    if (!accessSeparator) {
      return [target];
    }

    emit(skip);
    const next = emit(memberRec);

    return [target, ...next];
  },
);

export const member = P.tap("member")(P.mapError(
  memberRec,
  id,
  (parts) =>
    parts.length === 1
      ? parts[0]
      : parts.reduce((member, part) => new Ast.Member(member, part)),
));

export const unaryOpsP = unaryOps.map(P.chars).reduce(P.or);

export const unary: P.Parser<Ast.Expr> = P.tap("unary")(P.or(
  P.seq((emit) => {
    const op = emit(unaryOpsP);
    const expr = emit(unary);

    return new Ast.UnaryOp(op, expr);
  }),
  member,
));

export const expression = P.tap("expression")(unary);

export const statement: P.Parser<Ast.Expr> = P.tap("statement")(
  P.seq((emit) => {
    emit(skip);

    const expr = emit(
      P.or(variableDecl, P.or(print, expression)),
    );

    return expr;
  }),
);

export const mtlang = P.tap("mtlang")(P.map(
  P.seq((emit) => {
    const stmts = emit(P.oneOrMore(statement), "Expected a statement");
    emit(skip);

    const end = emit(P.mapError(
      P.seq((emit) => {
        return emit(eof, "Expected end of file");
      }),
      (e) => [e],
      cnst([]),
    ));

    return stmts.concat(end);
  }),
  (stmts) => Array.isArray(stmts) ? stmts : [stmts],
));
