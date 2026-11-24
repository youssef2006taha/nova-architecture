const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
}

export function saveAuthToken(token, rememberMe, refreshToken) {
  const persistentStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  try {
    persistentStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      persistentStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      persistentStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    otherStorage.removeItem(TOKEN_KEY);
    otherStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    clearAuthToken();
    throw error;
  }
}

export function saveRefreshedAuthTokens(token, refreshToken) {
  const rememberMe = localStorage.getItem(TOKEN_KEY) !== null;
  saveAuthToken(token, rememberMe, refreshToken);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
