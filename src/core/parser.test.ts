import {
  assertEquals,
} from "https://deno.land/std/testing/asserts.ts";

import { number, State, numeric, expr } from "./parser.ts";

Deno.test("number", () => {
  Deno.test("expected input", () => {
    const state = State.from("123");
    assertEquals(number(state), [1, state.clone({ location: 1 })]);
  });
});

Deno.test("numeric", () => {
  const state = State.from("123");
  assertEquals(numeric(state), ["1", state.clone({ location: 1 })]);
});

Deno.test("number", () => {
  const state = State.from("123");
  assertEquals(number(state), [123, state.clone({ location: 3 })]);
});

Deno.test("expr", () => {
  let state = State.from(" 25 +    25  ");

  assertEquals(
    expr(state),
    [50, state.clone({ location: state.source.length })],
  );

  state = State.from("25+25");

  assertEquals(
    expr(state),
    [50, state.clone({ location: state.source.length })],
  );
});
