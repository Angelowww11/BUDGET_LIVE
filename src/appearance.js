export const isDarkTheme = (theme) =>
  ["dark", "night", "black", "blueblack"].includes(theme);

export function colorMode(settings) {
  if (settings.colorMode === "light" || settings.colorMode === "dark")
    return settings.colorMode;
  return isDarkTheme(settings.theme) ? "dark" : "light";
}

export function toggleColorMode(settings) {
  settings.colorMode = colorMode(settings) === "dark" ? "light" : "dark";
}

export function selectColorTheme(settings, theme) {
  const previousMode = colorMode(settings);
  settings.theme = theme;
  settings.colorMode = isDarkTheme(theme) ? "dark" : previousMode;
}

const darkSwatches = {
  green: ["#a6caba", "#2b4033"],
  blue: ["#9bbaff", "#213556"],
  brown: ["#ddb18c", "#3b291e"],
  pink: ["#eba7c8", "#3a2230"],
  yellow: ["#e2c46d", "#372f17"],
  lavender: ["#c8afed", "#352645"],
  peach: ["#f2b18c", "#452c21"],
  cherry: ["#f19db6", "#422334"],
  teal: ["#8acbc3", "#20413b"],
};
const lightSwatches = {
  dark: ["#356e57", "#e3eee4"],
  night: ["#4f659a", "#e3e9f8"],
  black: ["#3e3e48", "#e6e6ea"],
  blueblack: ["#3461bf", "#dee7fa"],
};
export function themeSwatch(theme, accent, tint, settings) {
  const colors =
    colorMode(settings) === "dark" ? darkSwatches[theme] : lightSwatches[theme];
  return colors || [accent, tint];
}
