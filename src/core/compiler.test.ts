import { assert, assertEquals } from "../lib/asserts.ts";

import { runParser } from "./parser-combinators.ts";
import { mtlang } from "./parser.ts";
import { compile } from "./compiler.ts";

Deno.test("parse & compile", () => {
  const tests: [string, string][] = [
    [
      `(add
          1
          -2
          3)`,
      "add(1, -2, 3);",
    ],
    ["(effect)", "effect();"],
    ['(concat "1" "2")', 'concat("1", "2");'],
    ["(eq !true false)", "eq(!true, false);"],
    ["(+ 2 2)", "(2 + 2);"],
    ["(and true false)", "(true && false);"],
    ["(or true false)", "(true || false);"],
    ["(>= 10 5)", "(10 >= 5);"],
    ["(> 10 5)", "(10 > 5);"],
    ["(<= 10 5)", "(10 <= 5);"],
    ["(def mean (plus 40 2))", "const mean = plus(40, 2);"],
    [
      `(def (mult a b)
          (myMult a b))`,

      `\
function mult(a, b) {
  return myMult(a, b);
};`,
    ],
    ["(def value nil)", "const value = null;"],
    ["(def arr [1 true nil])", "const arr = [1, true, null];"],
    ["[1 2 3]/0", "[1, 2, 3][0];"],
    ['[1 2 3]/"0"', '[1, 2, 3]["0"];'],
    ["Date/now", "Date.now;"],
    ["(Date/now)", "Date.now();"],
    ["(([1 2 3]/slice 0 2)/join)", "[1, 2, 3].slice(0, 2).join();"],
  ];

  for (const [mtInput, expected] of tests) {
    const [actual, state] = runParser(mtInput, mtlang);

    assertEquals(state.errors, []);
    assert(actual, `failed to parse: ${mtInput}`);
    assertEquals(compile(actual[0]), expected);
  }
});
