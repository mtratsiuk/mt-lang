export const Keywords = {
  DEFINE: "def",
};

const keywords = new Set(Object.values(Keywords));

export type IsKeyword = (s: string) => boolean;
export const isKeyword: IsKeyword = (s) => keywords.has(s);
