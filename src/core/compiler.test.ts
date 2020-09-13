import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

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
} from "./ast.ts";

import { parse } from "./parser-combinators.ts";
import { mtlang } from "./parser.ts";
import { compile } from "./compiler.ts";

Deno.test("compiler", () => {
  const tests: [Expr, string][] = [
    [new BinMultOp(new NumLit(5), new NumLit(10)), "5 * 10"],
    [new BinDivOp(new NumLit(5), new NumLit(10)), "5 / 10"],
    [new BinMinusOp(new NumLit(5), new NumLit(10)), "5 - 10"],
    [new BinPlusOp(new NumLit(5), new NumLit(10)), "5 + 10"],
    [new BinPlusOp(new UnaryMinusOp(new NumLit(5)), new NumLit(10)), "-5 + 10"],
    [new Grouping(new BinPlusOp(new NumLit(5), new NumLit(10))), "(5 + 10)"],
    [
      new UnaryNotOp(
        new Grouping((new BinMoreThanOrEqOp(new NumLit(10), new NumLit(1)))),
      ),
      "!(10 >= 1)",
    ],
  ];

  for (const [ast, expected] of tests) {
    assertEquals(compile(ast), expected);
  }
});

Deno.test("parse & compile", () => {
  const tests: [string, string][] = [
    ["1 + 1", "1 + 1"],
    ["!true == false", "!true === false"],
    ["(5 + 5) * 25 >= 250 - 250 + 250", "(5 + 5) * 25 >= 250 - 250 + 250"],
    ["!!true", "!!true"],
  ];

  for (const [mtInput, expected] of tests) {
    const actual = parse(mtInput, mtlang);

    assert(actual, `failed to parse: ${mtInput}`);
    assertEquals(compile(actual), expected);
  }
});
