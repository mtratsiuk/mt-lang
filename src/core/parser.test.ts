import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { parse, runParser } from "./parser-combinators.ts";

import {
  number,
  string,
  boolean,
  unary,
  multiplication,
  addition,
  comparison,
  equality,
  expression,
  mtlang,
} from "./parser.ts";

import {
  NumLit,
  BinPlusOp,
  StrLit,
  BoolLit,
  UnaryNotOp,
  UnaryMinusOp,
  BinMultOp,
  BinDivOp,
  BinMinusOp,
  BinMoreThanOp,
  BinLessThanOp,
  BinLessThanOrEqOp,
  BinMoreThanOrEqOp,
  Expr,
  BinEqOp,
  BinNotEqOp,
  Grouping,
  ParseError,
} from "./ast.ts";

import { print } from "./ast-printer.ts";

const unterminatedStringErr = new ParseError(
  'Expected `"` terminating a string',
);
const unterminatedGroupingErr = new ParseError(
  "Expected `)` after expression",
);
const missingExprGroupingErr = new ParseError(
  "Expected expression after `(`",
);
const expectedExpressionErr = new ParseError(
  "Expected expression",
);

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

  [_, state] = runParser("123 + \n123", mtlang);
  assertEquals(state.location, 10);
  assertEquals(state.line, 1);

  [_, state] = runParser("\n123 + \n123\n", mtlang);
  assertEquals(state.location, 12);
  assertEquals(state.line, 3);
});

Deno.test("error tracking", () => {
  let [_, state] = runParser('"unterminated string', mtlang);
  assertEquals(state.errors, [unterminatedStringErr]);

  [_, state] = runParser("(5 + 5", mtlang);
  assertEquals(state.errors, [unterminatedGroupingErr]);

  [_, state] = runParser("()", mtlang);
  assertEquals(state.errors, [expectedExpressionErr]);

  [_, state] = runParser("5 + ", mtlang);
  assertEquals(state.errors, [expectedExpressionErr]);

  [_, state] = runParser('5 + ; "haha', mtlang);
  assertEquals(state.errors, [expectedExpressionErr, unterminatedStringErr]);
});
Deno.test("number", () => {
  assertAst(parse("123", number), new NumLit(123));
  assertAst(parse("", number), null);
});

Deno.test("string", () => {
  assertAst(parse('"text"', string), new StrLit("text"));
  assertAst(parse('""', string), new StrLit(""));
  assertAst(parse('"\n"', string), unterminatedStringErr);
  assertAst(parse('"123', string), unterminatedStringErr);
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
});

Deno.test("multiplication", () => {
  assertAst(
    parse("2 * 2", multiplication),
    new BinMultOp(new NumLit(2), new NumLit(2)),
  );
  assertAst(
    parse("2*2", multiplication),
    new BinMultOp(new NumLit(2), new NumLit(2)),
  );
  assertAst(
    parse("2*2/4", multiplication),
    new BinDivOp(new BinMultOp(new NumLit(2), new NumLit(2)), new NumLit(4)),
  );
});

Deno.test("addition", () => {
  assertAst(
    parse("2 + 2", addition),
    new BinPlusOp(new NumLit(2), new NumLit(2)),
  );
  assertAst(
    parse("2+2", addition),
    new BinPlusOp(new NumLit(2), new NumLit(2)),
  );
  assertAst(
    parse("2+2-4", addition),
    new BinMinusOp(new BinPlusOp(new NumLit(2), new NumLit(2)), new NumLit(4)),
  );
});

Deno.test("comparison", () => {
  assertAst(
    parse("5 > 2", comparison),
    new BinMoreThanOp(new NumLit(5), new NumLit(2)),
  );
  assertAst(
    parse("5 < 2", comparison),
    new BinLessThanOp(new NumLit(5), new NumLit(2)),
  );
  assertAst(
    parse("5 <= 2", comparison),
    new BinLessThanOrEqOp(new NumLit(5), new NumLit(2)),
  );
  assertAst(
    parse("5 >= 2", comparison),
    new BinMoreThanOrEqOp(new NumLit(5), new NumLit(2)),
  );
});

Deno.test("equality", () => {
  assertAst(
    parse("5 == 2", equality),
    new BinEqOp(new NumLit(5), new NumLit(2)),
  );
  assertAst(
    parse("5 != 2", equality),
    new BinNotEqOp(new NumLit(5), new NumLit(2)),
  );
});

Deno.test("expression", () => {
  assertAst(
    parse("5 + 2 * 10", expression),
    new BinPlusOp(new NumLit(5), new BinMultOp(new NumLit(2), new NumLit(10))),
  );
  assertAst(
    parse("(5 + 2) * 10", expression),
    new BinMultOp(
      new Grouping(new BinPlusOp(new NumLit(5), new NumLit(2))),
      new NumLit(10),
    ),
  );
  assertAst(
    parse("5 + 2 * 10 == 25", expression),
    new BinEqOp(
      new BinPlusOp(
        new NumLit(5),
        new BinMultOp(new NumLit(2), new NumLit(10)),
      ),
      new NumLit(25),
    ),
  );
});
