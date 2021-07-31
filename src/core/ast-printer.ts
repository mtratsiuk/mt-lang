import * as Ast from "./ast.ts";

export type Print = (
  expr: Ast.Expr | number | string | boolean,
  depth?: number,
) => string;
export const print: Print = (expr, depth = 0) => {
  if (
    typeof expr === "number" ||
    typeof expr === "boolean" ||
    expr == null
  ) {
    return `${expr}`;
  }

  if (typeof expr === "string") {
    return `"${expr}"`;
  }

  const offset = " ".repeat(depth * 2);

  if (Array.isArray(expr)) {
    return `[
${expr.map((value) => `  ${offset}${print(value, depth + 1)}`).join(",\n")}
${offset}]`;
  }

  return `${expr.constructor.name} {
${
    Object.getOwnPropertyNames(expr).map((key) =>
      // deno-lint-ignore no-explicit-any
      `  ${offset}${key}: ${print((expr as any)[key], depth + 1)}`
    ).join("\n")
  }
${offset}}`;
};
