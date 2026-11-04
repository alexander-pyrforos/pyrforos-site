import { expect, it } from "vitest";
import { blendCounts, pairKey, pickPairFromRows } from "../../src/votes";

it("blends seed votes while fewer than 10 real votes", () => {
  expect(blendCounts(2, 3, 4, 1, 4)).toEqual({ a: 6, b: 4 });
});

it("shows only real votes at 10 or more real votes", () => {
  expect(blendCounts(10, 12, 4, 1, 30)).toEqual({ a: 10, b: 12 });
  expect(blendCounts(4, 5, 1, 2, 10)).toEqual({ a: 4, b: 5 });
});

it("pairKey canonicalizes unordered pairs", () => {
  expect(pairKey("x", "y")).toBe("x|y");
  expect(pairKey("y", "x")).toBe("x|y");
});

it("pickPairFromRows picks least-voted pair honoring exclude", () => {
  const options = ["V1", "V2", "V3", "V4"];
  const votes = [
    { a_id: "V1", b_id: "V2", real: 3 },
    { a_id: "V1", b_id: "V3", real: 1 },
    { a_id: "V1", b_id: "V4", real: 2 },
    { a_id: "V2", b_id: "V4", real: 2 },
    { a_id: "V3", b_id: "V4", real: 2 },
  ];
  // V2|V3 is the only candidate with zero votes once V1|V3 is excluded
  const [a, b] = pickPairFromRows(votes, options, ["V1|V3"]);
  expect(pairKey(a, b)).toBe("V2|V3");
});

it("pickPairFromRows falls back when everything excluded", () => {
  const [a, b] = pickPairFromRows([], ["V1", "V2"], ["V1|V2", "V2|V1"]);
  expect(new Set([a, b])).toEqual(new Set(["V1", "V2"]));
});