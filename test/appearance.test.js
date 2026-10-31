import test from "node:test";
import assert from "node:assert/strict";
import {
  colorMode,
  toggleColorMode,
  selectColorTheme,
} from "../src/appearance.js";
import { emptyState, normalize, backup, restore } from "../src/store.js";

test("dark mode preserves every selected color instead of restoring a previous dark theme", () => {
  for (const theme of [
    "green",
    "blue",
    "brown",
    "pink",
    "yellow",
    "lavender",
    "peach",
    "cherry",
    "teal",
    "dark",
    "night",
    "black",
    "blueblack",
  ]) {
    const settings = {
      theme,
      colorMode: "light",
      lastDarkTheme: "blueblack",
      lastLightTheme: "blue",
    };
    toggleColorMode(settings);
    assert.equal(settings.theme, theme);
    assert.equal(colorMode(settings), "dark");
    toggleColorMode(settings);
    assert.equal(settings.theme, theme);
    assert.equal(colorMode(settings), "light");
  }
});
test("changing the color while dark keeps dark mode enabled", () => {
  const settings = { theme: "pink", colorMode: "dark" };
  selectColorTheme(settings, "brown");
  assert.equal(settings.theme, "brown");
  assert.equal(colorMode(settings), "dark");
});
test("legacy dark and light preferences are preserved on upgrade", () => {
  for (const [theme, expected] of [
    ["pink", "light"],
    ["blue", "light"],
    ["night", "dark"],
    ["black", "dark"],
  ]) {
    const old = emptyState();
    old.settings.theme = theme;
    delete old.settings.colorMode;
    assert.equal(normalize(old).settings.colorMode, expected);
  }
});
test("backup restores the selected palette and its dark mode together", () => {
  const state = emptyState();
  state.settings.theme = "pink";
  toggleColorMode(state.settings);
  const loaded = restore(backup(state));
  assert.equal(loaded.settings.theme, "pink");
  assert.equal(colorMode(loaded.settings), "dark");
});
