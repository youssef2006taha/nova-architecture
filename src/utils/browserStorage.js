export function readBrowserPreference(key) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read browser preference "${key}".`, error);
    return null;
  }
}

export function writeBrowserPreference(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Unable to save browser preference "${key}".`, error);
  }
}
