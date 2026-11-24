import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '../features/ui/uiSlice';
import langReducer from '../features/lang/langSlice';
import toastReducer from "../features/ui/toast/toastSlice"

import authReducer from "../features/authentication/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";
import { writeBrowserPreference } from "../utils/browserStorage";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    lang: langReducer,
    toast : toastReducer,
    auth : authReducer,
    cart : cartReducer,
  },
});

let previousLanguage = store.getState().lang.current;
let previousTheme = store.getState().ui.theme;

store.subscribe(() => {
  const { lang, ui } = store.getState();

  if (lang.current !== previousLanguage) {
    previousLanguage = lang.current;
    writeBrowserPreference("app_lang", lang.current);
  }
  if (ui.theme !== previousTheme) {
    previousTheme = ui.theme;
    writeBrowserPreference("app_theme", ui.theme);
  }
});
