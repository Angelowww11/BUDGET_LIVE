import test from "node:test";
import assert from "node:assert/strict";
import { calculateAmount } from "../src/calculator.js";
test("money calculations respect arithmetic order and round cents", () => {
  assert.equal(calculateAmount("120 + 80 × 2"), 280);
  assert.equal(calculateAmount("(120 + 80) ÷ 3"), 66.67);
  assert.equal(calculateAmount("1,200 - 200"), 1000);
  assert.equal(calculateAmount("250 × 10%"), 25);
  assert.equal(calculateAmount(".1 + .2"), 0.3);
});
test("incomplete, unsafe, negative and infinite amounts cannot be saved", () => {
  for (const value of [
    "1+",
    "1/0",
    "2-4",
    "alert(1)",
    "1..2",
    "(1+2",
    "1e20",
    "2**3",
  ])
    assert.throws(() => calculateAmount(value));
});
