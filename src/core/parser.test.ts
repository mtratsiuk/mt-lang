import { assertEquals } from "../lib/asserts.ts";

import * as Ast from "./ast.ts";
import { parse, runParser } from "./parser-combinators.ts";
import { print } from "./ast-printer.ts";

import {
  binary,
  boolean,
  expression,
  mtlang,
  nil,
  number,
  string,
  unary,
  variableDecl,
} from "./parser.ts";

const expectedQuoteClosingStringErr = new Ast.ParseError(
  'Expected `"` terminating a string',
);
const expectedExpressionAfterCallOpeningErr = new Ast.ParseError(
  "Expected expression after `(`",
);
const expectedBracketClosingFunctionCallErr = new Ast.ParseError(
  "Expected `)` closing function call",
);

export type AssertAst = (left: Ast.Expr | null, right: Ast.Expr | null) => void;
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
  let [_, state] = runParser('(concat "1" "2)', mtlang);
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
  assertAst(parse("123", number), new Ast.NumLit(123));
  assertAst(parse("", number), null);
});

Deno.test("string", () => {
  assertAst(parse('"text"', string), new Ast.StrLit("text"));
  assertAst(parse('""', string), new Ast.StrLit(""));
  assertAst(parse('"\n"', string), expectedQuoteClosingStringErr);
  assertAst(parse('"123', string), expectedQuoteClosingStringErr);
  assertAst(parse("123", string), null);
  assertAst(parse('"25"', string), new Ast.StrLit("25"));
  assertAst(parse('"true"', string), new Ast.StrLit("true"));
});

Deno.test("boolean", () => {
  assertAst(parse("true", boolean), new Ast.BoolLit(true));
  assertAst(parse("false", boolean), new Ast.BoolLit(false));
  assertAst(parse("trflse", boolean), null);
  assertAst(parse("truefalse", boolean), new Ast.BoolLit(true));
});

Deno.test("nil", () => {
  assertAst(parse("nil", nil), new Ast.NilLit());
});

Deno.test("unary", () => {
  assertAst(parse("!true", unary), new Ast.UnaryNotOp(new Ast.BoolLit(true)));
  assertAst(parse("-5", unary), new Ast.UnaryMinusOp(new Ast.NumLit(5)));
  assertAst(
    parse("--5", unary),
    new Ast.UnaryMinusOp(new Ast.UnaryMinusOp(new Ast.NumLit(5))),
  );
  assertAst(parse("15", unary), new Ast.NumLit(15));
  assertAst(
    parse("!(eq 4 4)", unary),
    new Ast.UnaryNotOp(
      new Ast.Call(new Ast.Identifier("eq"), [
        new Ast.NumLit(4),
        new Ast.NumLit(4),
      ]),
    ),
  );
});

Deno.test("binary", () => {
  assertAst(
    parse("(+ 4 2)", binary),
    new Ast.BinaryOp("+", new Ast.NumLit(4), new Ast.NumLit(2)),
  );
  assertAst(
    parse("(- 4 2)", binary),
    new Ast.BinaryOp("-", new Ast.NumLit(4), new Ast.NumLit(2)),
  );
  assertAst(
    parse("(* (+ 2 2) 2)", binary),
    new Ast.BinaryOp(
      "*",
      new Ast.BinaryOp("+", new Ast.NumLit(2), new Ast.NumLit(2)),
      new Ast.NumLit(2),
    ),
  );
});

Deno.test("expression", () => {
  assertAst(
    parse("(add 5 7)", expression),
    new Ast.Call(new Ast.Identifier("add"), [
      new Ast.NumLit(5),
      new Ast.NumLit(7),
    ]),
  );

  assertAst(
    parse(
      `(add
          1
          2
          3)`,
      expression,
    ),
    new Ast.Call(new Ast.Identifier("add"), [
      new Ast.NumLit(1),
      new Ast.NumLit(2),
      new Ast.NumLit(3),
    ]),
  );
});

Deno.test("variable declaration", () => {
  assertAst(
    parse(`(def pi 3)`, variableDecl),
    new Ast.VariableDecl("pi", new Ast.NumLit(3)),
  );

  assertAst(
    parse(
      `(def
         meaning
         (plus 40 2))`,
      variableDecl,
    ),
    new Ast.VariableDecl(
      "meaning",
      new Ast.Call(new Ast.Identifier("plus"), [
        new Ast.NumLit(40),
        new Ast.NumLit(2),
      ]),
    ),
  );
});
