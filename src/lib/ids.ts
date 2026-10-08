import { randomInt } from "node:crypto";

const LOWER = "abcdefghijkmnpqrstuvwxyz23456789"; // sem l, o, 0, 1 (fáceis de confundir)
const FULL = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

const pick = (alphabet: string, n: number) =>
  Array.from({ length: n }, () => alphabet[randomInt(alphabet.length)]).join("");

export const newSlug = () => pick(FULL, 14);
export const newShortCode = (n = 5) => pick(LOWER, n);
