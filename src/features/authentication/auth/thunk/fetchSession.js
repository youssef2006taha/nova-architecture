import { createAsyncThunk } from "@reduxjs/toolkit";
import { getMe as getMeApi } from "../../../../api/auth/auth.api";
import { getAuthToken } from "../tokenStorage";
import { getAuthErrorMessage } from "../authErrors";

export const fetchSession = createAsyncThunk(
  "auth/fetchSession",
  async (_, thunkApi) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return null;
      }

      const res = await getMeApi();

      return res;
    } catch (error) {
      return thunkApi.rejectWithValue(
        {
          status: error?.authSessionInvalid ? 401 : error?.response?.status,
          message: getAuthErrorMessage(error, "Unable to verify the session."),
        },
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const status = getState().auth.sessionStatus;
      return status !== "loading" && status !== "ready";
    },
  },
);
