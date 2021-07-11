export const Keywords = {
  DEFINE: "def",
  AND: "and",
  OR: "or",
};

const keywords = new Set(Object.values(Keywords));

export type IsKeyword = (s: string) => boolean;
export const isKeyword: IsKeyword = (s) => keywords.has(s);

export const BinaryOps = {
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "&": "&",
  "|": "|",
  "^": "^",
  "=": "===",
  "<=": "<=",
  "<": "<",
  ">=": ">=",
  ">": ">",
  [Keywords.OR]: "||",
  [Keywords.AND]: "&&",
};

export const binaryOps = Object.keys(BinaryOps);
