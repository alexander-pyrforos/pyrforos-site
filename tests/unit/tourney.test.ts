import { expect, it } from "vitest";
import {
  accumulateExcluded,
  choiceFor,
  mulberry32,
  shuffle,
} from "../../public/js/tournament";

it("choiceFor maps the clicked option to the API's a|b letter", () => {
  const pair = { a: { id: "V5" }, b: { id: "V2" } };
  expect(choiceFor(pair, "V2")).toBe("b");
  expect(choiceFor(pair, "V5")).toBe("a");
  expect(choiceFor(pair, "V9")).toBe("a"); // unknown id: fail closed to "a" never "V9"
});

it("accumulateExcluded canonicalizes and accumulates pair keys", () => {
  const excluded = new Set();
  accumulateExcluded(excluded, "V3", "V1");
  accumulateExcluded(excluded, "V1", "V3"); // same pair, other order
  expect(excluded).toEqual(new Set(["V1|V3"]));
  accumulateExcluded(excluded, "V2", "V4");
  expect(excluded).toEqual(new Set(["V1|V3", "V2|V4"]));
});

it("shuffle is deterministic under a seeded RNG", () => {
  const src = ["V1", "V2", "V3", "V4", "V5", "V6"];
  expect(shuffle(src, mulberry32(42))).toEqual(shuffle(src, mulberry32(42)));
  expect(shuffle(src, mulberry32(42))).toEqual(shuffle(src.slice(), mulberry32(42)));
  expect(shuffle(src, mulberry32(7))).not.toEqual(shuffle(src, mulberry32(42)));
});

it("shuffle keeps a permutation of the input", () => {
  const src = ["V1", "V2", "V3", "V4", "V5", "V6"];
  const out = shuffle(src, mulberry32(1));
  expect(new Set(out).size).toBe(6);
  for (const v of src) expect(out).toContain(v);
});