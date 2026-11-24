import { createAsyncThunk } from "@reduxjs/toolkit";
import { register as registerApi } from "../../../../api/auth/auth.api";
import { getAuthErrorMessage } from "../authErrors";

export const register = createAsyncThunk(
  "auth/register",
  async (registerData, thunkApi) => {
    try {
      await registerApi(registerData);
      return true;
    } catch (error) {
      return thunkApi.rejectWithValue(
        getAuthErrorMessage(error, "Registration failed."),
      );
    }
  },
);
