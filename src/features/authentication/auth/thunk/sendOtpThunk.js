import { createAsyncThunk } from "@reduxjs/toolkit";
import { forgotPassword as forgotPasswordApi } from "../../../../api/auth/auth.api";
import { getAuthErrorMessage } from "../authErrors";

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (email, thunkApi) => {
    try {
      await forgotPasswordApi({ email });
      return { email };
    } catch (error) {
      return thunkApi.rejectWithValue(
        getAuthErrorMessage(error, "Could not send the verification code."),
      );
    }
  },
);
