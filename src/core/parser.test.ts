import { assertEquals } from "../lib/asserts.ts";

import { parse, runParser } from "./parser-combinators.ts";

import {
  binary,
  boolean,
  expression,
  mtlang,
  number,
  string,
  unary,
  variableDecl,
} from "./parser.ts";

import {
  BinaryOp,
  BoolLit,
  Call,
  Expr,
  Identifier,
  NumLit,
  ParseError,
  StrLit,
  UnaryMinusOp,
  UnaryNotOp,
  VariableDecl,
} from "./ast.ts";

import { print } from "./ast-printer.ts";

const expectedQuoteClosingStringErr = new ParseError(
  'Expected `"` terminating a string',
);
const expectedExpressionAfterCallOpeningErr = new ParseError(
  "Expected expression after `(`",
);
const expectedBracketClosingFunctionCallErr = new ParseError(
  "Expected `)` closing function call",
);
const expectedStatementErr = new ParseError("Expected a statement");

export type AssertAst = (left: Expr | null, right: Expr | null) => void;
export const assertAst: AssertAst = (left, right) => {
  if (left === null || right === null) {
    assertEquals(left, right);
    return;
  }

  assertEquals(print(left), print(right));
};

Deno.test("location tracking", () => {
  let [_, state] = runParser("123", mtlang);
  assertEquals(state.location, 3);

  [_, state] = runParser("(plus \n  2\n  4)", mtlang);
  assertEquals(state.location, 15);
  assertEquals(state.line, 2);
});

Deno.test("error tracking", () => {
  let [_, state] = runParser("5", mtlang);
  assertEquals(state.errors, [expectedStatementErr]);

  [_, state] = runParser('(concat "1" "2)', mtlang);
  assertEquals(state.errors, [expectedQuoteClosingStringErr]);

  [_, state] = runParser('(concat "1 "2")', mtlang);
  assertEquals(state.errors, [expectedQuoteClosingStringErr]);

  [_, state] = runParser("(", mtlang);
  assertEquals(state.errors, [expectedExpressionAfterCallOpeningErr]);

  [_, state] = runParser("(plus", mtlang);
  assertEquals(state.errors, [expectedBracketClosingFunctionCallErr]);

  [_, state] = runParser("(plus 2 3", mtlang);
  assertEquals(state.errors, [expectedBracketClosingFunctionCallErr]);
});

Deno.test("number", () => {
  assertAst(parse("123", number), new NumLit(123));
  assertAst(parse("", number), null);
});

Deno.test("string", () => {
  assertAst(parse('"text"', string), new StrLit("text"));
  assertAst(parse('""', string), new StrLit(""));
  assertAst(parse('"\n"', string), expectedQuoteClosingStringErr);
  assertAst(parse('"123', string), expectedQuoteClosingStringErr);
  assertAst(parse("123", string), null);
  assertAst(parse('"25"', string), new StrLit("25"));
  assertAst(parse('"true"', string), new StrLit("true"));
});

Deno.test("boolean", () => {
  assertAst(parse("true", boolean), new BoolLit(true));
  assertAst(parse("false", boolean), new BoolLit(false));
  assertAst(parse("trflse", boolean), null);
  assertAst(parse("truefalse", boolean), new BoolLit(true));
});

Deno.test("unary", () => {
  assertAst(parse("!true", unary), new UnaryNotOp(new BoolLit(true)));
  assertAst(parse("-5", unary), new UnaryMinusOp(new NumLit(5)));
  assertAst(
    parse("--5", unary),
    new UnaryMinusOp(new UnaryMinusOp(new NumLit(5))),
  );
  assertAst(parse("15", unary), new NumLit(15));
  assertAst(
    parse("!(eq 4 4)", unary),
    new UnaryNotOp(
      new Call(new Identifier("eq"), [new NumLit(4), new NumLit(4)]),
    ),
  );
});

Deno.test("binary", () => {
  assertAst(
    parse("(+ 4 2)", binary),
    new BinaryOp("+", new NumLit(4), new NumLit(2)),
  );
  assertAst(
    parse("(- 4 2)", binary),
    new BinaryOp("-", new NumLit(4), new NumLit(2)),
  );
  assertAst(
    parse("(* (+ 2 2) 2)", binary),
    new BinaryOp(
      "*",
      new BinaryOp("+", new NumLit(2), new NumLit(2)),
      new NumLit(2),
    ),
  );
});

Deno.test("expression", () => {
  assertAst(
    parse("(add 5 7)", expression),
    new Call(new Identifier("add"), [new NumLit(5), new NumLit(7)]),
  );

  assertAst(
    parse(
      `(add
          1
          2
          3)`,
      expression,
    ),
    new Call(new Identifier("add"), [
      new NumLit(1),
      new NumLit(2),
      new NumLit(3),
    ]),
  );
});

Deno.test("variable declaration", () => {
  assertAst(
    parse(`(def pi 3)`, variableDecl),
    new VariableDecl("pi", new NumLit(3)),
  );

  assertAst(
    parse(
      `(def
         meaning
         (plus 40 2))`,
      variableDecl,
    ),
    new VariableDecl(
      "meaning",
      new Call(new Identifier("plus"), [new NumLit(40), new NumLit(2)]),
    ),
  );
});
