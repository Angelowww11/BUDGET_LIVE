import test from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEY,
  RECOVERY_KEY,
  emptyState,
  normalize,
  load,
  save,
  backup,
  restore,
} from "../src/store.js";
class MemoryStorage {
  values = new Map();
  fail = false;
  getItem(key) {
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    if (this.fail) throw new Error("Full storage");
    this.values.set(key, value);
  }
}
const legacy = () => ({
  version: 1,
  settings: {
    budget: 15000,
    currency: "PHP",
    cycle: "monthly",
    rollover: true,
    theme: "pink",
  },
  transactions: [
    {
      id: "original-id",
      type: "expense",
      amount: 125.5,
      category: "Food",
      date: "2026-10-25T11:00:00+08:00",
      note: "Original note",
      customField: "keep me",
    },
  ],
  categories: ["Food", "Custom"],
  templates: [],
  goals: [],
});

test("legacy records retain identity and all fields with additive defaults", () => {
  const value = legacy(),
    upgraded = normalize(value);
  assert.deepEqual(upgraded.transactions, value.transactions);
  assert.equal(upgraded.settings.theme, "pink");
  assert.deepEqual(upgraded.bills, []);
  assert.deepEqual(restore(backup(upgraded)), upgraded);
});
test("saving keeps the previous copy and detects another window", () => {
  globalThis.localStorage = new MemoryStorage();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy()));
  const old = localStorage.getItem(STORAGE_KEY),
    data = load();
  data.settings.budget = 16000;
  save(data);
  assert.equal(localStorage.getItem(RECOVERY_KEY), old);
  const external = JSON.stringify({ ...legacy(), external: true });
  localStorage.setItem(STORAGE_KEY, external);
  assert.throws(() => save(data), /another window/);
  assert.equal(localStorage.getItem(STORAGE_KEY), external);
});
test("failed writes and corrupted reads never erase the saved value", () => {
  globalThis.localStorage = new MemoryStorage();
  const raw = JSON.stringify(legacy());
  localStorage.setItem(STORAGE_KEY, raw);
  const data = load();
  data.settings.budget = 25000;
  localStorage.fail = true;
  assert.throws(() => save(data), /Full storage/);
  assert.equal(localStorage.getItem(STORAGE_KEY), raw);
  localStorage.fail = false;
  localStorage.setItem(STORAGE_KEY, "{broken");
  assert.throws(load, /could not be opened/);
  assert.equal(localStorage.getItem(STORAGE_KEY), "{broken");
});
test("invalid backups are rejected before a replacement can be saved", () => {
  const invalid = legacy();
  invalid.transactions[0].amount = -1;
  assert.throws(() => restore(backup(invalid)), /transactions are invalid/);
  assert.throws(() => restore('{"app":"other"}'), /not a Daylight/);
  assert.deepEqual(normalize(emptyState()).transactions, []);
});
