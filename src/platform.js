import {
  Capacitor,
  SystemBars,
  SystemBarsStyle,
  registerPlugin,
} from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export const isNativeApp = Capacitor.isNativePlatform();
export const APP_VERSION = import.meta.env.APP_VERSION;
export const ANDROID_DOWNLOAD =
  "https://github.com/Angelowww11/BUDGET_LIVE/releases/latest/download/MYMP-Android.apk";
export const RELEASES_URL =
  "https://github.com/Angelowww11/BUDGET_LIVE/releases";
const WindowAppearance = registerPlugin("WindowAppearance");
let lastAppearance;

export function updateNativeAppearance(mode) {
  if (!isNativeApp) return;
  const background = getComputedStyle(document.documentElement)
    .getPropertyValue("--page")
    .trim();
  const appearance = `${mode}:${background}`;
  if (appearance === lastAppearance) return;
  lastAppearance = appearance;
  WindowAppearance.setBackground({ color: background }).catch(() => {});
  SystemBars.setStyle({
    style: mode === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
  }).catch(() => {});
}

export async function initNative({ back, resume }) {
  if (!isNativeApp) return;
  document.documentElement.dataset.platform = "native";
  await App.addListener("backButton", async () => {
    if (!back()) await App.minimizeApp();
  });
  await App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) resume();
  });
  await SplashScreen.hide();
}

export async function saveNativeFile(name, content) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = await Filesystem.writeFile({
    path: `exports/${safeName}`,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  await Share.share({
    title: "Save M.Y.M.P. backup or export",
    files: [file.uri],
    dialogTitle: "Choose where to save your file",
  });
}
