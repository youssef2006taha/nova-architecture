import axios from 'axios'
import {
  clearAuthToken,
  getAuthToken,
  getRefreshToken,
  saveRefreshedAuthTokens,
} from "../features/authentication/auth/tokenStorage";

const apiInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "" : "https://platformofcourses.runasp.net"),
  withCredentials : true
})

let refreshPromise = null;
let lastRefreshedTokens = null;
let sessionExpiryHandled = false;

const createSessionError = (message) => {
  const error = new Error(message);
  error.authSessionInvalid = true;
  return error;
};

const getAuthorization = (headers) =>
  headers?.Authorization || headers?.get?.("Authorization") || "";

const getBearerToken = (headers) => {
  const authorization = getAuthorization(headers);
  return typeof authorization === "string"
    ? authorization.replace(/^Bearer\s+/i, "")
    : "";
};

const setAuthorization = (config, token) => {
  config.headers.Authorization = `Bearer ${token}`;
};

const expireSession = () => {
  if (sessionExpiryHandled) return;

  sessionExpiryHandled = true;
  clearAuthToken();
  window.dispatchEvent(new Event("auth:session-expired"));

  if (!window.location.pathname.startsWith("/login")) {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const accessToken = getAuthToken();
    const refreshToken = getRefreshToken();

    if (!accessToken || !refreshToken) {
      return Promise.reject(createSessionError("The session cannot be refreshed."));
    }

    refreshPromise = apiInstance
      .post(
        "/api/Auth/refresh",
        { accessToken, refreshToken },
        { skipAuth: true },
      )
      .then(({ data }) => {
        if (data?.succeeded === false) {
          throw createSessionError(data.message || "The session could not be refreshed.");
        }

        const nextAccessToken = data?.accessToken;
        const nextRefreshToken = data?.refreshToken;
        if (
          typeof nextAccessToken !== "string" ||
          !nextAccessToken.trim() ||
          typeof nextRefreshToken !== "string" ||
          !nextRefreshToken.trim()
        ) {
          throw new Error("The refresh response did not include both tokens.");
        }

        saveRefreshedAuthTokens(nextAccessToken.trim(), nextRefreshToken.trim());
        lastRefreshedTokens = {
          previousAccessToken: accessToken,
          accessToken: nextAccessToken.trim(),
        };
        sessionExpiryHandled = false;
        return nextAccessToken.trim();
      })
      .catch((error) => {
        if (error.authSessionInvalid || error.response?.status === 401) {
          expireSession();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiInstance.interceptors.request.use((config) => {
  if (config.skipAuth) {
    config._skipAuth = true;
    delete config.skipAuth;
    return config;
  }

  const token = getAuthToken()
  if (token) {
    setAuthorization(config, token);
    sessionExpiryHandled = false;
  }
  return config
})

apiInstance.interceptors.response.use(
  (res) => res ,
  (err) => {
    const config = err.config;
    const requestToken = getBearerToken(config?.headers);
    const currentToken = getAuthToken();

    if (
      err.response?.status !== 401 ||
      !requestToken ||
      config?._skipAuth
    ) {
      return Promise.reject(err);
    }

    if (config._authRetry) {
      if (requestToken === currentToken) expireSession();
      return Promise.reject(err);
    }

    if (!currentToken) {
      return Promise.reject(err);
    }

    if (requestToken !== currentToken) {
      if (
        lastRefreshedTokens?.previousAccessToken === requestToken &&
        lastRefreshedTokens.accessToken === currentToken
      ) {
        config._authRetry = true;
        setAuthorization(config, currentToken);
        return apiInstance.request(config);
      }
      return Promise.reject(err);
    }

    config._authRetry = true;
    return refreshAccessToken()
      .then((token) => {
        setAuthorization(config, token);
        return apiInstance.request(config);
      })
      .catch((refreshError) => {
        if (
          refreshError.authSessionInvalid ||
          refreshError.response?.status === 401
        ) {
          expireSession();
        }
        return Promise.reject(refreshError);
      });
  }
)

const api = {
  get: (url, config = {}) => apiInstance.get(url, config).then(res => res.data),
  post: (url, data, config = {}) => apiInstance.post(url, data, config).then(res => res.data),
  put: (url, data, config = {}) => apiInstance.put(url, data, config).then(res => res.data),
  patch: (url, data, config = {}) => apiInstance.patch(url, data, config).then(res => res.data),
  delete: (url, config = {}) => apiInstance.delete(url, config).then(res => res.data),
};

export default api;