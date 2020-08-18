import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import {
  number,
  string,
  numeric,
  parse,
  runParser,
  binaryPlusExpr,
  State,
} from "./parser.ts";
import { NumLit, BinPlusOp, StrLit } from "./ast.ts";

Deno.test("numeric", () => {
  assertEquals(parse("123", numeric), "1");
});

Deno.test("number", () => {
  assertEquals(parse("123", number), new NumLit(123));
  assertEquals(parse("", number), null);
});

Deno.test("string", () => {
  assertEquals(parse('"text"', string), new StrLit("text"));
  assertEquals(parse('""', string), new StrLit(""));
  assertEquals(parse('"\n"', string), null);
  assertEquals(parse('"25"', string), new StrLit("25"));
});

Deno.test("binaryPlusExpr", () => {
  assertEquals(
    parse(" 25 +    25  ", binaryPlusExpr),
    new BinPlusOp(new NumLit(25), new NumLit(25)),
  );

  assertEquals(
    parse("25+25", binaryPlusExpr),
    new BinPlusOp(new NumLit(25), new NumLit(25)),
  );

  assertEquals(
    parse("25 25", binaryPlusExpr),
    null,
  );

  assertEquals(
    parse("25 +", binaryPlusExpr),
    null,
  );

  assertEquals(
    parse('25 + "25"', binaryPlusExpr),
    null,
  );

  const state = State.from("25 + 25\n +50");

  assertEquals(
    binaryPlusExpr(state),
    [
      new BinPlusOp(
        new NumLit(25),
        new BinPlusOp(new NumLit(25), new NumLit(50)),
      ),
      new State(
        { source: state.source, location: state.source.length, line: 1 },
      ),
    ],
  );
});
