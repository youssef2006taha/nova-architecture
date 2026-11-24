import { createAsyncThunk } from "@reduxjs/toolkit";
import { resetPassword as resetPasswordApi } from "../../../../api/auth/auth.api";
import { getAuthErrorMessage } from "../authErrors";

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, thunkApi) => {
    try {
      await resetPasswordApi(resetData);
      return true;
    } catch (error) {
      return thunkApi.rejectWithValue(
        getAuthErrorMessage(error, "Could not reset the password."),
      );
    }
  },
);
