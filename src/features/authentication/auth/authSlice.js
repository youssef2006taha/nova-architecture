import { createSlice } from "@reduxjs/toolkit";
import { login } from "./thunk/loginThunk";
import { logout } from "./thunk/logoutThunk";
import { register } from "./thunk/registerThunk";
import { sendOtp } from "./thunk/sendOtpThunk";
import { resetPassword } from "./thunk/resetPasswordThunk";
import { fetchSession } from "./thunk/fetchSession";

const resetAuthState = (state, error = null) => {
  state.loading = false;
  state.user = null;
  state.error = error;
  state.isAuthenticated = false;
  state.sessionStatus = "ready";
  state.sessionError = null;
};

const authSlice = createSlice({
  name : "auth",

  initialState : {
    user : null , 
    loading : false ,
    sessionStatus : "idle",
    sessionError : null,
    registerLoading : false,
    sendOtpLoading : false,
    resetPasswordLoading : false,
    error : null ,
    passwordResetEmail : "",
    isAuthenticated : false
  },

  reducers : {
    sessionExpired: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.sessionStatus = "ready";
      state.sessionError = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ================= login =================
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || null;
        state.isAuthenticated = true;
        state.sessionStatus = "ready";
        state.sessionError = null;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(register.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.registerLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.registerLoading = false;
        state.error = action.payload;
      })

      .addCase(sendOtp.pending, (state) => {
        state.sendOtpLoading = true;
        state.passwordResetEmail = "";
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.sendOtpLoading = false;
        state.passwordResetEmail = action.payload.email;
        state.error = null;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.sendOtpLoading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.passwordResetEmail = "";
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.error = action.payload;
      })

      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.user = null;
        state.isAuthenticated = false;
        state.sessionStatus = "ready";
        state.sessionError = null;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        resetAuthState(state);
      })
      .addCase(logout.rejected, (state, action) => {
        resetAuthState(state, action.payload);
      })

      // ================= fetchSession =================
      .addCase(fetchSession.pending, (state) => {
        state.sessionStatus = "loading";
        state.sessionError = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.sessionStatus = "ready";
        state.sessionError = null;
        if (!action.payload) {
          state.user = null;
          state.isAuthenticated = false;
        } else {
          state.user = action.payload.user || action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(fetchSession.rejected, (state, action) => {
        if (action.meta.condition) return;

        if (action.payload?.status === 401) {
          state.user = null;
          state.isAuthenticated = false;
          state.sessionStatus = "ready";
          state.sessionError = null;
          return;
        }

        state.sessionStatus = "error";
        state.sessionError = action.payload?.message || "Unable to verify the session.";
      })
  }
})

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
