import { createAsyncThunk } from "@reduxjs/toolkit";
import { login as loginApi } from "../../../../api/auth/auth.api";
import { saveAuthToken } from "../tokenStorage";
import { getAuthErrorMessage } from "../authErrors";

export const login = createAsyncThunk(
  "auth/login",
  async ({ rememberMe = false, ...loginData }, thunkApi) => {
    try {
      const res = await loginApi(loginData);
      const token = res?.accessToken || res?.token || res?.access_token;

      if (res?.succeeded !== true) {
        return thunkApi.rejectWithValue(
          getAuthErrorMessage({ response: { data: res } }, "Login failed."),
        );
      }

      if (typeof token !== "string" || !token.trim()) {
        return thunkApi.rejectWithValue(
          "The login response did not include an access token.",
        );
      }

      const refreshToken = res.refreshToken || res.refresh_token || null;
      if (typeof refreshToken !== "string" || !refreshToken.trim()) {
        return thunkApi.rejectWithValue(
          "The login response did not include a refresh token.",
        );
      }

      const responseUser = res.user && typeof res.user === "object" ? res.user : {};
      const user = {
        ...responseUser,
        userId: responseUser.userId ?? res.userId,
        email: responseUser.email ?? res.email,
        fullName: responseUser.fullName ?? res.fullName,
        roles: responseUser.roles ?? res.roles ?? [],
      };

      saveAuthToken(token.trim(), rememberMe, refreshToken.trim());

      return { ...res, user };
    } catch (error) {
      return thunkApi.rejectWithValue(getAuthErrorMessage(error, "Login failed."));
    }
  },
);
