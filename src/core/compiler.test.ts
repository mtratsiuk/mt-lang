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
      "add(1, -2, 3)",
    ],
    ['(concat "1" "2")', 'concat("1", "2")'],
    ["(eq !true false)", "eq(!true, false)"],
  ];

  for (const [mtInput, expected] of tests) {
    const [actual, state] = runParser(mtInput, mtlang);

    assertEquals(state.errors, []);
    assert(actual, `failed to parse: ${mtInput}`);
    assertEquals(compile(actual[0]), expected);
  }
});
