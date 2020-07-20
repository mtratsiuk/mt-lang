import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { number, numeric, parse, binaryPlusExpr } from "./parser.ts";
import { NumberLiteral, BinPlusOp } from "./ast.ts";

Deno.test("numeric", () => {
  assertEquals(parse("123", numeric), "1");
});

Deno.test("number", () => {
  assertEquals(parse("123", number), new NumberLiteral(123));
});

Deno.test("binaryPlusExpr", () => {
  assertEquals(
    parse(" 25 +    25  ", binaryPlusExpr),
    new BinPlusOp(new NumberLiteral(25), new NumberLiteral(25)),
  );

  assertEquals(
    parse("25+25", binaryPlusExpr),
    new BinPlusOp(new NumberLiteral(25), new NumberLiteral(25)),
  );

  assertEquals(
    parse("25 25", binaryPlusExpr),
    null,
  );

  assertEquals(
    parse("25 + 25 + 50", binaryPlusExpr),
    new BinPlusOp(
      new NumberLiteral(25),
      new BinPlusOp(new NumberLiteral(25), new NumberLiteral(50)),
    ),
  );
});
