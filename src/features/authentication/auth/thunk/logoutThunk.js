import { createAsyncThunk } from "@reduxjs/toolkit";
import { revokeToken as revokeTokenApi } from "../../../../api/auth/auth.api";
import { clearAuthToken, getRefreshToken } from "../tokenStorage";
import { getAuthErrorMessage } from "../authErrors";

export const logout = createAsyncThunk("auth/logout", async (_, thunkApi) => {
  try {
    const refreshToken = getRefreshToken();
    clearAuthToken();

    if (refreshToken) {
      await revokeTokenApi({ refreshToken });
    }

    return true;
  } catch (error) {
    clearAuthToken();
    return thunkApi.rejectWithValue(
      getAuthErrorMessage(error, "Logout failed."),
    );
  }
});
