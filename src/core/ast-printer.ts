import * as Ast from "./ast.ts";

export type Print = (
  expr: Ast.Expr | number | string | boolean,
  depth?: number,
) => string;
export const print: Print = (expr, depth = 0) => {
  if (
    typeof expr === "string" || typeof expr === "number" ||
    typeof expr === "boolean"
  ) {
    return expr.toString();
  }

  const offest = " ".repeat(depth * 2);

  return `${expr.constructor.name} {
${
    Object.getOwnPropertyNames(expr).map((key) =>
      // deno-lint-ignore no-explicit-any
      `  ${offest}${key}: ${print((expr as any)[key], depth + 1)}`
    ).join("\n")
  }
${offest}}`;
};
