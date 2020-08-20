import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import {
  number,
  string,
  numeric,
  parse,
  runParser,
  binaryPlusExpr,
  State,
  boolean,
  unary,
  multiplication,
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
} from "./ast.ts";

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
  assertEquals(parse('"true"', string), new StrLit("true"));
});

Deno.test("boolean", () => {
  assertEquals(parse("true", boolean), new BoolLit(true));
  assertEquals(parse("false", boolean), new BoolLit(false));
  assertEquals(parse("trflse", boolean), null);
  assertEquals(parse("truefalse", boolean), new BoolLit(true));
});

Deno.test("multiplication", () => {
  assertEquals(
    parse("2 * 2", multiplication),
    new BinMultOp(new NumLit(2), new NumLit(2)),
  );
  assertEquals(
    parse("2*2", multiplication),
    new BinMultOp(new NumLit(2), new NumLit(2)),
  );
  assertEquals(
    parse("2*2/2", multiplication),
    new BinDivOp(new BinMultOp(new NumLit(2), new NumLit(2)), new NumLit(2)),
  );
});

Deno.test("unary", () => {
  assertEquals(parse("!true", unary), new UnaryNotOp(new BoolLit(true)));
  assertEquals(parse("-5", unary), new UnaryMinusOp(new NumLit(5)));
  assertEquals(
    parse("--5", unary),
    new UnaryMinusOp(new UnaryMinusOp(new NumLit(5))),
  );
  assertEquals(parse("15", unary), new NumLit(15));
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
